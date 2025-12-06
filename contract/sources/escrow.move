/// Token escrow module for GasMeUp protocol
/// Manages temporary token storage during swap operations
module gasmeup::escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::tx_context::TxContext;
    use sui::object::UID;
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use gasmeup::types;

    // ======== Structs ========
    
    /// Escrow vault for holding tokens
    /// Generic type T represents the token type (e.g., USDC)
    public struct EscrowVault<phantom T> has key {
        id: UID,
        balance: Balance<T>,
    }
    
    /// Admin capability for escrow management
    public struct EscrowAdminCap has key, store {
        id: UID,
    }

    // ======== Initialization ========
    
    /// Initialize the escrow module
    /// Creates admin cap and sends to deployer
    fun init(ctx: &mut TxContext) {
        let admin_cap = EscrowAdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ======== Public Entry Functions ========
    
    /// Create a new escrow vault for a specific token type
    public entry fun create_vault<T>(ctx: &mut TxContext) {
        let vault = EscrowVault<T> {
            id: object::new(ctx),
            balance: balance::zero<T>(),
        };
        transfer::share_object(vault);
    }
    
    /// Deposit tokens into escrow vault
    /// Returns the deposited amount
    public fun deposit<T>(
        vault: &mut EscrowVault<T>,
        token: Coin<T>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): u64 {
        let amount = coin::value(&token);
        assert!(amount > 0, types::e_invalid_amount());
        
        let coin_balance = coin::into_balance(token);
        balance::join(&mut vault.balance, coin_balance);
        
        // Emit deposit event
        types::emit_deposit_event(
            tx_context::sender(ctx),
            amount,
            clock::timestamp_ms(clock),
        );
        
        amount
    }
    
    /// Release tokens from escrow to recipient
    /// Can only be called by authorized functions (friend modules)
    public(package) fun release<T>(
        vault: &mut EscrowVault<T>,
        amount: u64,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(amount > 0, types::e_invalid_amount());
        assert!(balance::value(&vault.balance) >= amount, types::e_insufficient_balance());
        
        let withdrawn_balance = balance::split(&mut vault.balance, amount);
        let coin = coin::from_balance(withdrawn_balance, ctx);
        
        // Emit release event
        types::emit_release_event(
            recipient,
            amount,
            clock::timestamp_ms(clock),
        );
        
        transfer::public_transfer(coin, recipient);
    }

    // ======== View Functions ========
    
    /// Get the current balance in the escrow vault
    public fun get_balance<T>(vault: &EscrowVault<T>): u64 {
        balance::value(&vault.balance)
    }
    
    // ======== Admin Functions ========
    
    /// Emergency withdraw function (admin only)
    /// Allows admin to recover tokens in case of emergency
    public entry fun emergency_withdraw<T>(
        _admin_cap: &EscrowAdminCap,
        vault: &mut EscrowVault<T>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        assert!(amount > 0, types::e_invalid_amount());
        assert!(balance::value(&vault.balance) >= amount, types::e_insufficient_balance());
        
        let withdrawn_balance = balance::split(&mut vault.balance, amount);
        let coin = coin::from_balance(withdrawn_balance, ctx);
        transfer::public_transfer(coin, recipient);
    }

    // ======== Test Functions ========
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
