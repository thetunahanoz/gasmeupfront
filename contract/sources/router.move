/// Router module - Main entry point for GasMeUp protocol
/// Coordinates PTB operations for atomic token-to-gas swaps
module gasmeup::router {
    use sui::coin::{Self, Coin};
    use sui::tx_context::TxContext;
    use sui::object::UID;
    use sui::transfer;
    use sui::clock::{Clock, timestamp_ms};
    use gasmeup::escrow::{Self, EscrowVault};
    use gasmeup::fee::{Self, FeeConfig};
    use gasmeup::types;

    // ======== Structs ========
    
    /// Protocol admin capability
    public struct AdminCap has key, store {
        id: UID,
    }
    
    /// Treasury configuration
    public struct TreasuryConfig has key {
        id: UID,
        treasury_address: address,
    }

    // ======== Initialization ========
    
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        
        let treasury_config = TreasuryConfig {
            id: object::new(ctx),
            treasury_address: tx_context::sender(ctx),
        };
        
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(treasury_config);
    }

    // ======== Main Swap Function ========
    
    /// Swap tokens for gas (SUI coins)
    /// This is the main entry point for user transactions
    /// 
    /// Flow:
    /// 1. User provides tokens
    /// 2. Calculate required amounts and fees
    /// 3. Deposit tokens to escrow
    /// 4. Split fee to treasury
    /// 5. Transfer SUI gas to user (sponsored by Enoki in PTB)
    /// 
    /// Note: In production with Enoki, the SUI transfer portion
    /// would be added to the PTB and sponsored automatically
    public entry fun swap_tokens_for_gas<T>(
        vault: &mut EscrowVault<T>,
        fee_config: &FeeConfig,
        treasury_config: &TreasuryConfig,
        mut user_tokens: Coin<T>,
        min_gas_out: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let user = tx_context::sender(ctx);
        let token_amount = coin::value(&user_tokens);
        
        // Validate input
        assert!(token_amount > 0, types::e_invalid_amount());
        
        // Calculate gas amount based on tokens provided
        let gas_amount = fee::calculate_gas_amount(fee_config, token_amount);
        
        // Check slippage tolerance
        assert!(gas_amount >= min_gas_out, types::e_slippage_exceeded());
        
        // Calculate fee
        let fee_amount = fee::calculate_fee(fee_config, token_amount);
        assert!(fee_amount < token_amount, types::e_invalid_amount());
        
        // Split fee from user tokens
        let fee_coin = coin::split(&mut user_tokens, fee_amount, ctx);
        
        // Deposit remaining tokens to escrow
        let _deposited = escrow::deposit(vault, user_tokens, clock, ctx);
        
        // Transfer fee to treasury
        transfer::public_transfer(fee_coin, treasury_config.treasury_address);
        
        // Emit swap event
        types::emit_swap_event(
            user,
            token_amount,
            gas_amount,
            fee_amount,
            timestamp_ms(clock),
        );
        
        // Note: In a real implementation with Enoki PTB:
        // - The SUI transfer would be part of the PTB
        // - Enoki would sponsor the gas for this entire transaction
        // - The user would receive `gas_amount` SUI automatically
        // 
        // For MVP testing, the SUI transfer can be simulated externally
        // or added as a separate step in the PTB
    }
    
    /// Swap tokens for a specific gas amount
    /// User specifies how much SUI they want, system calculates token cost
    public entry fun swap_for_exact_gas<T>(
        vault: &mut EscrowVault<T>,
        fee_config: &FeeConfig,
        treasury_config: &TreasuryConfig,
        mut user_tokens: Coin<T>,
        exact_gas_amount: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let user = tx_context::sender(ctx);
        
        // Calculate total token cost
        let (total_cost, gas_amount, fee_amount) = fee::calculate_total_cost(
            fee_config,
            exact_gas_amount,
        );
        
        let token_amount = coin::value(&user_tokens);
        
        // Ensure user has enough tokens
        assert!(token_amount >= total_cost, types::e_insufficient_balance());
        
        // Split exact amount needed
        let mut tokens_to_use = if (token_amount > total_cost) {
            let excess = token_amount - total_cost;
            let excess_coin = coin::split(&mut user_tokens, excess, ctx);
            // Return excess to user
            transfer::public_transfer(excess_coin, user);
            user_tokens
        } else {
            user_tokens
        };
        
        // Split fee from tokens
        let fee_coin = coin::split(&mut tokens_to_use, fee_amount, ctx);
        
        // Deposit remaining tokens to escrow
        let _deposited = escrow::deposit(vault, tokens_to_use, clock, ctx);
        
        // Transfer fee to treasury
        transfer::public_transfer(fee_coin, treasury_config.treasury_address);
        
        // Emit swap event
        types::emit_swap_event(
            user,
            total_cost,
            gas_amount,
            fee_amount,
            timestamp_ms(clock),
        );
    }

    // ======== View Functions ========
    
    /// Get treasury address
    public fun get_treasury_address(config: &TreasuryConfig): address {
        config.treasury_address
    }
    
    /// Calculate swap quote: how much gas for given token amount
    public fun get_swap_quote(
        fee_config: &FeeConfig,
        token_amount: u64,
    ): (u64, u64) {
        let gas_amount = fee::calculate_gas_amount(fee_config, token_amount);
        let fee_amount = fee::calculate_fee(fee_config, token_amount);
        (gas_amount, fee_amount)
    }
    
    /// Calculate reverse quote: how much token needed for desired gas
    public fun get_reverse_quote(
        fee_config: &FeeConfig,
        desired_gas: u64,
    ): (u64, u64, u64) {
        fee::calculate_total_cost(fee_config, desired_gas)
    }

    // ======== Admin Functions ========
    
    /// Update treasury address
    public entry fun update_treasury_address(
        _admin_cap: &AdminCap,
        config: &mut TreasuryConfig,
        new_treasury: address,
    ) {
        config.treasury_address = new_treasury;
    }

    // ======== Test Functions ========
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
