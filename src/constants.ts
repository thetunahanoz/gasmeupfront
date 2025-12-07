export const NETWORK = 'testnet'; // or 'mainnet'

export const GASMEUP_PACKAGE_ID = '0x74995641a3d72177fa7c9d28660b6ec84b22aa6fb3e30a8df3148632e40a04bc';
export const GASMEUP_MODULE = 'router';

export const SUI_CLOCK_OBJECT_ID = '0x6';

// Tokens
export const SUI_TYPE = '0x2::sui::SUI';
export const USDC_TYPE = '0x74995641a3d72177fa7c9d28660b6ec84b22aa6fb3e30a8df3148632e40a04bc::mock_usdc::MOCK_USDC';

// Decimals
export const SUI_DECIMALS = 9;
export const USDC_DECIMALS = 6;

// Vaults
export const SUI_VAULT_ID = '0xa53e589ba1d6950b5655e20065f2c4103e84a9eef29441209001e49b4f22b114';
export const USDC_VAULT_ID = '0x260f94539f17abb12a020307ba59f82e467c86b630228f74d2ba8e57552e3481';

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

// Expected gas cost for backend tx (0.005 SUI = 5_000_000 MIST)
export const EXPECTED_GAS_COST_SUI = 0.005;

// Backend relay
// export const BACKEND_RELAY_URL = 'http://localhost:3001/sponsor';
export const BACKEND_RELAY_URL = 'https://gasmeupbackend.vercel.app/sponsor';
export const BACKEND_RELAY_PUBKEY = '0x7b36c63375bfb148650cbe7a0ccbc690e87a95cd85acf495ab41ffb9a1b83fdf';
