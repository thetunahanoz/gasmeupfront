import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
    GASMEUP_PACKAGE_ID,
    GASMEUP_MODULE,
    ESCROW_VAULT_ID,
    FEE_CONFIG_ID,
    TREASURY_CONFIG_ID,
    SUI_CLOCK_OBJECT_ID
} from '../constants';

export function useSwapTransaction() {
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const swapTokensForGas = async (
        tokenType: string,
        coinId: string, // ID of the specific Coin<T> object to swap
        amount: number, // Raw amount (e.g. 1000000)
        minGasOut: number
    ) => {
        const txb = new Transaction();

        // If amount is less than coin value, we might need to split? 
        // For simplicity in MVP, we assume coinId is the exact coin object provided 
        // or we handle splitting if we had more advanced logic.
        // Here we just pass the object directly.

        txb.moveCall({
            target: `${GASMEUP_PACKAGE_ID}::${GASMEUP_MODULE}::swap_tokens_for_gas`,
            typeArguments: [tokenType],
            arguments: [
                txb.object(ESCROW_VAULT_ID),
                txb.object(FEE_CONFIG_ID),
                txb.object(TREASURY_CONFIG_ID),
                txb.object(coinId),
                txb.pure.u64(minGasOut),
                txb.object(SUI_CLOCK_OBJECT_ID),
            ],
        });

        return signAndExecute({
            transaction: txb,
        });
    };

    return { swapTokensForGas };
}
