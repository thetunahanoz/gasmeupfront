/// Shared types and constants for GasMeUp protocol
module gasmeup::types;

use sui::event;

// ======== Constants ========

/// Default fee percentage (basis points: 500 = 5%)
const DEFAULT_FEE_BPS: u64 = 500;

/// Basis points denominator (10000 = 100%)
const BPS_DENOMINATOR: u64 = 10000;

/// Simulated exchange rate: 1 SUI = 10 USDC (for MVP)
/// In production, this will be fetched from oracle
const SIMULATED_SUI_PRICE_USDC: u64 = 10;

/// Profit markup percentage (basis points: 1000 = 10%)
const PROFIT_MARKUP_BPS: u64 = 1000;

// ======== Error Codes ========

/// Insufficient balance for the operation
const EInsufficientBalance: u64 = 1;

/// Invalid fee configuration
const EInvalidFeeConfig: u64 = 2;

/// Unauthorized access
const EUnauthorized: u64 = 3;

/// Invalid amount (zero or too large)
const EInvalidAmount: u64 = 4;

/// Slippage tolerance exceeded
const ESlippageExceeded: u64 = 5;

// ======== Structs ========

/// Event emitted when a swap is completed
public struct SwapEvent has copy, drop {
    user: address,
    token_amount: u64,
    gas_amount: u64,
    fee_amount: u64,
    timestamp: u64,
}

/// Event emitted when tokens are deposited to escrow
public struct DepositEvent has copy, drop {
    user: address,
    amount: u64,
    timestamp: u64,
}

/// Event emitted when tokens are released from escrow
public struct ReleaseEvent has copy, drop {
    recipient: address,
    amount: u64,
    timestamp: u64,
}

/// Event emitted when fee configuration is updated
public struct FeeConfigUpdatedEvent has copy, drop {
    old_fee_bps: u64,
    new_fee_bps: u64,
    timestamp: u64,
}

// ======== Public Functions ========

/// Get default fee in basis points
public fun default_fee_bps(): u64 {
    DEFAULT_FEE_BPS
}

/// Get basis points denominator
public fun bps_denominator(): u64 {
    BPS_DENOMINATOR
}

/// Get simulated SUI price
public fun simulated_sui_price(): u64 {
    SIMULATED_SUI_PRICE_USDC
}

/// Get profit markup percentage
public fun profit_markup_bps(): u64 {
    PROFIT_MARKUP_BPS
}

/// Emit swap event
public fun emit_swap_event(
    user: address,
    token_amount: u64,
    gas_amount: u64,
    fee_amount: u64,
    timestamp: u64,
) {
    event::emit(SwapEvent {
        user,
        token_amount,
        gas_amount,
        fee_amount,
        timestamp,
    });
}

/// Emit deposit event
public fun emit_deposit_event(user: address, amount: u64, timestamp: u64) {
    event::emit(DepositEvent {
        user,
        amount,
        timestamp,
    });
}

/// Emit release event
public fun emit_release_event(recipient: address, amount: u64, timestamp: u64) {
    event::emit(ReleaseEvent {
        recipient,
        amount,
        timestamp,
    });
}

/// Emit fee config updated event
public fun emit_fee_config_updated_event(old_fee_bps: u64, new_fee_bps: u64, timestamp: u64) {
    event::emit(FeeConfigUpdatedEvent {
        old_fee_bps,
        new_fee_bps,
        timestamp,
    });
}

// ======== Error Code Getters ========

public fun e_insufficient_balance(): u64 { EInsufficientBalance }

public fun e_invalid_fee_config(): u64 { EInvalidFeeConfig }

public fun e_unauthorized(): u64 { EUnauthorized }

public fun e_invalid_amount(): u64 { EInvalidAmount }

public fun e_slippage_exceeded(): u64 { ESlippageExceeded }
