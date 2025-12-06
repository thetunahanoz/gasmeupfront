# GasMeUp Smart Contracts - Quick Reference

## Project Overview

**GasMeUp!** allows users to exchange their tokens for SUI gas on Sui Network using oracle-based pricing. Built for the Sui hackathon.

## Key Features

- ✅ **Atomic swaps** via Programmable Transaction Blocks (PTB)
- ✅ **Oracle-based pricing** with 10% profit markup
- ✅ **5% protocol commission** on all transactions
- ✅ **Backend-relay ready** for sponsored transactions
- ✅ **Type-safe** generic token support

## Module Summary

### 1. `types.move`
- Shared constants and events
- Error code definitions
- Default fee: 5%, Markup: 10%

### 2. `escrow.move`
- Token vault management
- Deposit/release operations
- Emergency recovery functions

### 3. `fee.move`
- Oracle-based price calculations
- Commission computation
- Admin configuration

### 4. `router.move`
- Main swap entry points
- PTB coordination
- Treasury management

## Quick Start

### Build
```bash
cd /Users/mehmet/buildonsui2
sui move build
```

### Publish to Testnet
```bash
sui client publish --gas-budget 100000000
```

### Create Escrow Vault
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module escrow \
  --function create_vault \
  --type-args <TOKEN_TYPE> \
  --gas-budget 10000000
```

## Pricing Model

**Example**: User wants 0.01 SUI gas
- Oracle price: 1 SUI = 10 USDC
- Base cost: 0.1 USDC
- Markup (10%): 0.01 USDC
- Subtotal: 0.11 USDC
- Fee (5%): 0.0055 USDC
- **Total: 0.1155 USDC**

## Important Files

- [Move.toml](file:///Users/mehmet/buildonsui2/Move.toml) - Package config
- [types.move](file:///Users/mehmet/buildonsui2/sources/types.move) - Constants & events
- [escrow.move](file:///Users/mehmet/buildonsui2/sources/escrow.move) - Token vault
- [fee.move](file:///Users/mehmet/buildonsui2/sources/fee.move) - Pricing engine
- [router.move](file:///Users/mehmet/buildonsui2/sources/router.move) - Swap coordinator

## Security

- ✅ Move language safety
- ✅ Capability-based access control
- ✅ Atomic PTB operations
- ✅ Event transparency
- ✅ Admin emergency functions

## Status

**Build**: ✅ Passing  
**Tests**: Ready for testnet  
**Deployment**: Awaiting testnet publish
