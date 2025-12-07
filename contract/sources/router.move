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
/// 3. Convert remaining USDC to SUI at 0.64 rate
/// 4. Check minimum SUI output (safe gas check)
/// 5. Deposit ALL USDC (including fee) to USDC vault
/// 6. Release SUI from SUI vault to user
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

    // Calculate 2% fee
    let fee_amount = (usdc_amount * FEE_BPS) / BPS_DENOMINATOR;

    // Calculate remaining amount after fee
    let remaining_usdc = usdc_amount - fee_amount;

    // Convert remaining USDC to SUI
    // usdc (6 decimals) * rate * decimal_adjustment = sui (9 decimals)
    let sui_out =
        (remaining_usdc * USDC_TO_SUI_RATE_NUM * DECIMAL_ADJUSTMENT) / USDC_TO_SUI_RATE_DEN;

    // Check minimum SUI output (safe gas check)
    assert!(sui_out >= min_sui_out, types::e_slippage_exceeded());

    // Deposit ALL USDC (including fee) to USDC vault
    // Fee stays in the vault as protocol revenue
    let _deposited = escrow::deposit(usdc_vault, usdc_payment, clock, ctx);

    // Release SUI from SUI vault to user
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
/// Returns (sui_out, fee_amount)
public fun calculate_swap(usdc_amount: u64): (u64, u64) {
    let fee_amount = (usdc_amount * FEE_BPS) / BPS_DENOMINATOR;
    let remaining = usdc_amount - fee_amount;
    let sui_out = (remaining * USDC_TO_SUI_RATE_NUM * DECIMAL_ADJUSTMENT) / USDC_TO_SUI_RATE_DEN;
    (sui_out, fee_amount)
}

/// Get current fee in basis points
public fun get_fee_bps(): u64 {
    FEE_BPS
}

/// Get current exchange rate as (numerator, denominator)
public fun get_exchange_rate(): (u64, u64) {
    (USDC_TO_SUI_RATE_NUM, USDC_TO_SUI_RATE_DEN)
}

// ======== Test Functions ========

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
