export const NETWORK = 'testnet'; // or 'mainnet'

export const GASMEUP_PACKAGE_ID = '0xc642e2b82e15dce050671a35e12f16cb19256bdc8cf0438bc94d866563bf9b2a';
export const GASMEUP_MODULE = 'router';

export const SUI_CLOCK_OBJECT_ID = '0x6';

// Tokens
export const SUI_TYPE = '0x2::sui::SUI';
export const USDC_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

// Decimals
export const SUI_DECIMALS = 9;
export const USDC_DECIMALS = 6;

// Vaults
export const SUI_VAULT_ID = '0x0';
export const USDC_VAULT_ID = '0x0';

// Pricing (hardcoded for now)
export const FEE_PERCENT = 0.02; // 2%
export const USDC_TO_SUI_RATE = 0.64; // 1 USDC = 0.64 SUI

// Safe gas calculation
// Typical swap transaction uses ~5000 gas units
export const TYPICAL_GAS_UNITS = 5000n;
// Multiplier for safety margin (1.5x)
export const SAFE_GAS_MULTIPLIER = 1.5;
// Fallback minimum SUI if RPC fails (0.01 SUI = 10_000_000 MIST)
export const FALLBACK_MIN_SUI = 10_000_000n;

// Backend relay
export const BACKEND_RELAY_URL = 'http://localhost:3001/sponsor';
export const BACKEND_RELAY_PUBKEY = '0x7b36c63375bfb148650cbe7a0ccbc690e87a95cd85acf495ab41ffb9a1b83fdf';
