/// Router module - Main entry point for GasMeUp protocol
module gasmeup::router;

use gasmeup::escrow::{Self, EscrowVault};
use gasmeup::types;
use sui::clock::{Clock, timestamp_ms};
use sui::coin::{Self, Coin};
use sui::object::UID;
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::TxContext;

// ======== Constants ========

/// Service fee: 2% (200 basis points)
const FEE_BPS: u64 = 200;

/// Basis points denominator
const BPS_DENOMINATOR: u64 = 10000;

/// Exchange rate: 1 USDC = 0.64 SUI
/// Stored as 64 / 100 for integer math
/// USDC has 6 decimals, SUI has 9 decimals
/// So: sui_amount = usdc_amount * 64 / 100 * 1000 (to convert 6 decimals to 9)
const USDC_TO_SUI_RATE_NUM: u64 = 64;
const USDC_TO_SUI_RATE_DEN: u64 = 100;
const DECIMAL_ADJUSTMENT: u64 = 1000; // 10^9 / 10^6 = 1000

/// Expected gas cost for backend tx (in MIST = 10^-9 SUI)
/// 0.005 SUI = 5,000,000 MIST
const EXPECTED_GAS_COST_SUI: u64 = 5_000_000;

// ======== Structs ========

/// Protocol admin capability
public struct AdminCap has key, store {
    id: UID,
}

// ======== Initialization ========

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, tx_context::sender(ctx));
}

// ======== Main Swap Function ========

/// Swap USDC for SUI gas
///
/// Flow:
/// 1. User provides USDC payment
/// 2. Calculate 2% service fee
/// 3. Calculate backend gas cost (SUI → USDC)
/// 4. Subtract both from payment
/// 5. Convert remaining USDC to SUI at 0.64 rate
/// 6. Check minimum SUI output (safe gas check)
/// 7. Deposit ALL USDC (including fee) to USDC vault
/// 8. Release SUI from SUI vault to user
public entry fun swap_usdc_for_sui<T>(
    usdc_vault: &mut EscrowVault<T>,
    sui_vault: &mut EscrowVault<SUI>,
    usdc_payment: Coin<T>,
    min_sui_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let user = tx_context::sender(ctx);
    let usdc_amount = coin::value(&usdc_payment);

    // Validate input
    assert!(usdc_amount > 0, types::e_invalid_amount());

    // 1. Calculate 2% service fee
    let fee_amount = (usdc_amount * FEE_BPS) / BPS_DENOMINATOR;

    // 2. Calculate backend gas cost in USDC
    // gas_cost_usdc = gas_sui / rate = gas_sui * rate_den / (rate_num * decimal_adj)
    let gas_cost_usdc =
        (EXPECTED_GAS_COST_SUI * USDC_TO_SUI_RATE_DEN) / 
                        (USDC_TO_SUI_RATE_NUM * DECIMAL_ADJUSTMENT);

    // 3. Calculate remaining after fee and gas cost
    let total_deductions = fee_amount + gas_cost_usdc;
    assert!(usdc_amount > total_deductions, types::e_invalid_amount());
    let remaining_usdc = usdc_amount - total_deductions;

    // 4. Convert remaining USDC to SUI
    // usdc (6 decimals) * rate * decimal_adjustment = sui (9 decimals)
    let sui_out =
        (remaining_usdc * USDC_TO_SUI_RATE_NUM * DECIMAL_ADJUSTMENT) / USDC_TO_SUI_RATE_DEN;

    // 5. Check minimum SUI output (slippage and safe gas check)
    assert!(sui_out >= min_sui_out, types::e_slippage_exceeded());

    // 6. Deposit ALL USDC (including fee and gas coverage) to USDC vault
    let _deposited = escrow::deposit(usdc_vault, usdc_payment, clock, ctx);

    // 7. Release SUI from SUI vault to user
    escrow::release(sui_vault, sui_out, user, clock, ctx);

    // Emit swap event
    types::emit_swap_event(
        user,
        usdc_amount,
        sui_out,
        fee_amount,
        timestamp_ms(clock),
    );
}

// ======== View Functions ========

/// Calculate how much SUI user will receive for given USDC amount
/// Returns (sui_out, fee_amount, gas_cost_usdc)
public fun calculate_swap(usdc_amount: u64): (u64, u64, u64) {
    let fee_amount = (usdc_amount * FEE_BPS) / BPS_DENOMINATOR;
    let gas_cost_usdc =
        (EXPECTED_GAS_COST_SUI * USDC_TO_SUI_RATE_DEN) / 
                        (USDC_TO_SUI_RATE_NUM * DECIMAL_ADJUSTMENT);

    if (usdc_amount <= fee_amount + gas_cost_usdc) {
        return (0, fee_amount, gas_cost_usdc)
    };

    let remaining = usdc_amount - fee_amount - gas_cost_usdc;
    let sui_out = (remaining * USDC_TO_SUI_RATE_NUM * DECIMAL_ADJUSTMENT) / USDC_TO_SUI_RATE_DEN;
    (sui_out, fee_amount, gas_cost_usdc)
}

/// Get current fee in basis points
public fun get_fee_bps(): u64 {
    FEE_BPS
}

/// Get current exchange rate as (numerator, denominator)
public fun get_exchange_rate(): (u64, u64) {
    (USDC_TO_SUI_RATE_NUM, USDC_TO_SUI_RATE_DEN)
}

/// Get expected gas cost in SUI (MIST)
public fun get_expected_gas_cost(): u64 {
    EXPECTED_GAS_COST_SUI
}

// ======== Test Functions ========

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
