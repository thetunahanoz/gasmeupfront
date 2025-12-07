import { Transaction } from '@mysten/sui/transactions';
import { useSignTransaction } from '@mysten/dapp-kit';
import {
    GASMEUP_PACKAGE_ID,
    GASMEUP_MODULE,
    BACKEND_RELAY_URL,
    BACKEND_RELAY_PUBKEY,
    USDC_VAULT_ID,
    SUI_VAULT_ID,
    SUI_CLOCK_OBJECT_ID,
    USDC_TYPE,
} from '../constants';

export interface RelayResponse {
    success: boolean;
    digest?: string;
    error?: string;
}

export function useSwapTransaction() {
    const { mutateAsync: signTransaction } = useSignTransaction();

    /**
     * Swap USDC for SUI via backend relay.
     * 
     * Contract handles:
     * - Service fee (stays in USDC vault)
     * - Conversion rate
     * - Min SUI check
     */
    const swapUsdcForSui = async (
        usdcCoinId: string,
        usdcAmount: number, // Amount in base units (6 decimals)
        minSuiOut: number,
        senderAddress: string
    ): Promise<RelayResponse> => {
        const txb = new Transaction();

        // Split the exact amount from the user's coin
        const [paymentCoin] = txb.splitCoins(txb.object(usdcCoinId), [usdcAmount]);

        // Call gasmeup::router::swap_usdc_for_sui<USDC>
        txb.moveCall({
            target: `${GASMEUP_PACKAGE_ID}::${GASMEUP_MODULE}::swap_usdc_for_sui`,
            typeArguments: [USDC_TYPE],
            arguments: [
                txb.object(USDC_VAULT_ID),       // usdc_vault
                txb.object(SUI_VAULT_ID),        // sui_vault
                paymentCoin,                     // usdc_payment (split coin)
                txb.pure.u64(minSuiOut),         // min_sui_out
                txb.object(SUI_CLOCK_OBJECT_ID), // clock
            ],
        });

        // Set sender
        txb.setSender(senderAddress);

        // Backend pays gas
        txb.setGasOwner(BACKEND_RELAY_PUBKEY);

        // Sign (user wallet prompt)
        const { bytes, signature } = await signTransaction({
            transaction: txb,
        });

        // Submit to backend
        return submitToBackend(bytes, signature);
    };

    const submitToBackend = async (
        txBytes: string,
        signature: string
    ): Promise<RelayResponse> => {
        try {
            const response = await fetch(BACKEND_RELAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txBytes, signature }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: `Backend error: ${response.status} - ${errorText}` };
            }

            const result = await response.json();
            return { success: true, digest: result.digest };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    };

    return { swapUsdcForSui, submitToBackend };
}
