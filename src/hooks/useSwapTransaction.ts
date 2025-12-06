import { Transaction } from '@mysten/sui/transactions';
import { useSignTransaction } from '@mysten/dapp-kit';
import {
    GASMEUP_PACKAGE_ID,
    GASMEUP_MODULE,
    BACKEND_RELAY_URL,
} from '../constants';

export interface RelayResponse {
    success: boolean;
    digest?: string;
    error?: string;
}

export function useSwapTransaction() {
    const { mutateAsync: signTransaction } = useSignTransaction();

    /**
     * Build, sign, and submit a swap transaction via backend relay.
     * 
     * Flow:
     * 1. Build the transaction (PTB)
     * 2. User signs via wallet (sign-only, no execution)
     * 3. Serialize signed tx and POST to backend
     * 4. Backend pays gas and submits to Sui network
     */
    const swapTokensForGas = async (
        tokenType: string,
        coinId: string,
        amount: number,
        gasBudgetMist: number,
        senderAddress: string
    ): Promise<RelayResponse> => {
        // 1. Build the transaction
        const txb = new Transaction();

        let paymentCoin;
        let isSuiSplit = false;

        // If the token is SUI, split from Gas Coin to avoid "double spend" error
        if (tokenType === '0x2::sui::SUI') {
            const splitAmount = txb.pure.u64(amount);
            paymentCoin = txb.splitCoins(txb.gas, [splitAmount]);
            isSuiSplit = true;
        } else {
            paymentCoin = txb.object(coinId);
        }

        // Call gasmeup::router::pay_for_gas<T>
        txb.moveCall({
            target: `${GASMEUP_PACKAGE_ID}::${GASMEUP_MODULE}::pay_for_gas`,
            typeArguments: [tokenType],
            arguments: [
                paymentCoin,
                txb.pure.u64(gasBudgetMist),
            ],
        });

        // Transfer remaining split coin back to user
        if (isSuiSplit) {
            txb.transferObjects([paymentCoin], txb.pure.address(senderAddress));
        }

        // Set sender for proper transaction construction
        txb.setSender(senderAddress);

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
