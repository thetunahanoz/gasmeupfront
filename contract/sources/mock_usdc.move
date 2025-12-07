/// Mock USDC token for testing purposes
/// Deploy this to testnet to get a mintable USDC-like token
module gasmeup::mock_usdc;

use sui::coin::{Self, TreasuryCap, Coin};
use sui::url;

/// The type identifier for Mock USDC
public struct MOCK_USDC has drop {}

/// One-time witness for coin creation
fun init(witness: MOCK_USDC, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency<MOCK_USDC>(
        witness,
        6, // 6 decimals like real USDC
        b"USDC",
        b"USD Coin",
        b"USD Coin for testing GasMeUp",
        option::some(
            url::new_unsafe_from_bytes(b"https://cryptologos.cc/logos/usd-coin-usdc-logo.png"),
        ),
        ctx,
    );

    // Freeze metadata so it can be read by anyone but not changed
    transfer::public_freeze_object(metadata);

    // Share the treasury cap so anyone can mint (for testing only!)
    transfer::public_share_object(treasury_cap);
}

/// Mint new mock USDC tokens
/// Anyone can call this since TreasuryCap is shared (for testing purposes)
public entry fun mint(
    treasury: &mut TreasuryCap<MOCK_USDC>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let coin = coin::mint(treasury, amount, ctx);
    transfer::public_transfer(coin, recipient);
}

/// Mint to self (convenience function)
public entry fun mint_to_self(
    treasury: &mut TreasuryCap<MOCK_USDC>,
    amount: u64,
    ctx: &mut TxContext,
) {
    let coin = coin::mint(treasury, amount, ctx);
    transfer::public_transfer(coin, tx_context::sender(ctx));
}

/// Burn tokens
public entry fun burn(treasury: &mut TreasuryCap<MOCK_USDC>, coin: Coin<MOCK_USDC>) {
    coin::burn(treasury, coin);
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(MOCK_USDC {}, ctx);
}
