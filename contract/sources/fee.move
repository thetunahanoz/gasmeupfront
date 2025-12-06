/// Fee calculation and management module for GasMeUp protocol
module gasmeup::fee {
    use sui::object::UID;
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use gasmeup::types;

    // ======== Structs ========
    
    /// Fee configuration object
    public struct FeeConfig has key, store {
        id: UID,
        /// Fee in basis points (e.g., 500 = 5%)
        fee_bps: u64,
        /// Protocol treasury address
        treasury: address,
    }
    
    /// Admin capability for fee management
    public struct FeeAdminCap has key, store {
        id: UID,
    }

    // ======== Initialization ========
    
    /// Initialize fee configuration
    fun init(ctx: &mut TxContext) {
        let admin_cap = FeeAdminCap {
            id: object::new(ctx),
        };
        
        let fee_config = FeeConfig {
            id: object::new(ctx),
            fee_bps: types::default_fee_bps(),
            treasury: tx_context::sender(ctx),
        };
        
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(fee_config);
    }

    // ======== Public Functions ========
    
    /// Calculate fee amount from total amount
    /// Returns the fee amount based on configured fee_bps
    public fun calculate_fee(config: &FeeConfig, amount: u64): u64 {
        (amount * config.fee_bps) / types::bps_denominator()
    }
    
    /// Calculate gas amount needed based on oracle price + markup
    /// For MVP: Uses simulated price (1 SUI = 10 USDC)
    /// Returns the SUI amount needed for the given token amount
    public fun calculate_gas_amount(_config: &FeeConfig, token_amount: u64): u64 {
        // Simulated oracle price: 1 SUI = 10 USDC
        let sui_price = types::simulated_sui_price();
        
        // Calculate base SUI needed
        let base_sui = token_amount / sui_price;
        
        // Apply profit markup (10% by default)
        let markup = (base_sui * types::profit_markup_bps()) / types::bps_denominator();
        
        base_sui + markup
    }
    
    /// Calculate total token amount needed for desired gas amount
    /// Includes both the gas cost and protocol fee
    /// Returns tuple: (total_token_needed, gas_amount, fee_amount)
    public fun calculate_total_cost(
        config: &FeeConfig,
        desired_gas_sui: u64,
    ): (u64, u64, u64) {
        // Calculate token amount needed for gas (with markup)
        let sui_price = types::simulated_sui_price();
        let markup_multiplier = types::bps_denominator() + types::profit_markup_bps();
        let token_for_gas = (desired_gas_sui * sui_price * markup_multiplier) / types::bps_denominator();
        
        // Calculate protocol fee
        let fee_amount = calculate_fee(config, token_for_gas);
        
        // Total cost = gas cost + fee
        let total_token_needed = token_for_gas + fee_amount;
        
        (total_token_needed, desired_gas_sui, fee_amount)
    }
    
    /// Get treasury address from config
    public fun get_treasury(config: &FeeConfig): address {
        config.treasury
    }
    
    /// Get current fee in basis points
    public fun get_fee_bps(config: &FeeConfig): u64 {
        config.fee_bps
    }

    // ======== Admin Functions ========
    
    /// Update fee configuration (admin only)
    public entry fun update_fee_config(
        _admin_cap: &FeeAdminCap,
        config: &mut FeeConfig,
        new_fee_bps: u64,
        clock: &Clock,
    ) {
        assert!(new_fee_bps <= types::bps_denominator(), types::e_invalid_fee_config());
        
        let old_fee_bps = config.fee_bps;
        config.fee_bps = new_fee_bps;
        
        // Emit update event
        types::emit_fee_config_updated_event(
            old_fee_bps,
            new_fee_bps,
            clock::timestamp_ms(clock),
        );
    }
    
    /// Update treasury address (admin only)
    public entry fun update_treasury(
        _admin_cap: &FeeAdminCap,
        config: &mut FeeConfig,
        new_treasury: address,
    ) {
        config.treasury = new_treasury;
    }

    // ======== Test Functions ========
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
    
    #[test_only]
    public fun create_fee_config_for_testing(
        fee_bps: u64,
        treasury: address,
        ctx: &mut TxContext,
    ): FeeConfig {
        FeeConfig {
            id: object::new(ctx),
            fee_bps,
            treasury,
        }
    }
}
