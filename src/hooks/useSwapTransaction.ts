import { Transaction } from '@mysten/sui/transactions';
import { useSignTransaction } from '@mysten/dapp-kit';
import {
    GASMEUP_PACKAGE_ID,
    GASMEUP_MODULE,
    BACKEND_RELAY_URL,
    BACKEND_RELAY_PUBKEY,
    USDC_VAULT_ID,
    SUI_VAULT_ID,
    FEE_CONFIG_ID,
    TREASURY_CONFIG_ID,
    SUI_CLOCK_OBJECT_ID,
} from '../constants';

export interface RelayResponse {
    success: boolean;
    digest?: string;
    error?: string;
}

export function useSwapTransaction() {
    const { mutateAsync: signTransaction } = useSignTransaction();

    /**
     * Build, sign, and submit a USDC-to-SUI swap transaction via backend relay.
     * 
     * Flow:
     * 1. Build the transaction (PTB)
     * 2. User signs via wallet (sign-only, no execution)
     * 3. Serialize signed tx and POST to backend
     * 4. Backend pays gas and submits to Sui network
     * 
     * Contract receives USDC from user, releases SUI to user from SUI vault.
     */
    const swapTokensForGas = async (
        usdcCoinId: string,
        minGasOut: number,
        senderAddress: string
    ): Promise<RelayResponse> => {
        // 1. Build the transaction
        const txb = new Transaction();

        // User's USDC coin object
        const usdcCoin = txb.object(usdcCoinId);

        // Call gasmeup::router::swap_tokens_for_gas<USDC>
        // Arguments: token_vault, sui_vault, fee_config, treasury_config, user_tokens, min_gas_out, clock
        txb.moveCall({
            target: `${GASMEUP_PACKAGE_ID}::${GASMEUP_MODULE}::swap_tokens_for_gas`,
            typeArguments: ['0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'],
            arguments: [
                txb.object(USDC_VAULT_ID),       // token_vault (USDC vault)
                txb.object(SUI_VAULT_ID),        // sui_vault
                txb.object(FEE_CONFIG_ID),       // fee_config
                txb.object(TREASURY_CONFIG_ID),  // treasury_config
                usdcCoin,                        // user_tokens (USDC)
                txb.pure.u64(minGasOut),         // min_gas_out
                txb.object(SUI_CLOCK_OBJECT_ID), // clock
            ],
        });

        // Set sender for proper transaction construction
        txb.setSender(senderAddress);

        // Backend pays gas
        txb.setGasOwner(BACKEND_RELAY_PUBKEY);

        // 2. Sign the transaction (user wallet prompt)
        const { bytes, signature } = await signTransaction({
            transaction: txb,
        });

        // 3. Submit to backend relay
        const response = await submitToBackend(bytes, signature);

        return response;
    };

    /**
     * Submit signed transaction bytes + signature to backend relay.
     * Backend will pay gas and execute on Sui network.
     */
    const submitToBackend = async (
        txBytes: string,
        signature: string
    ): Promise<RelayResponse> => {
        try {
            const response = await fetch(BACKEND_RELAY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    txBytes,
                    signature,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `Backend error: ${response.status} - ${errorText}`,
                };
            }

            const result = await response.json();
            return {
                success: true,
                digest: result.digest,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    };

    return { swapTokensForGas, submitToBackend };
}
