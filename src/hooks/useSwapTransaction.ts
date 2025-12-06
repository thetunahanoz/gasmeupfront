import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
    GASMEUP_PACKAGE_ID,
    GASMEUP_MODULE
} from '../constants';

export function useSwapTransaction() {
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const swapTokensForGas = async (
        tokenType: string,
        coinId: string, // ID of the specific Coin<T> object to swap
        amount: number, // We might not need this if we rely on coin object balance, but pay_for_gas takes gas_budget_mist
        gasBudgetMist: number, // This matches the 2nd arg of pay_for_gas
        senderAddress: string // Needed to return the split coin to the user
    ) => {
        const txb = new Transaction();

        let paymentCoin;
        let isSuiSplit = false;

        // If the token is SUI, we should split from the Gas Coin to avoid "double spend" / "no gas" error
        // because the wallet needs a gas object, and if we pass the only SUI coin as argument, it fails.
        if (tokenType === '0x2::sui::SUI') {
            // Calculate amount to split (payAmount in MIST)
            // We need to pass 'amount' argument to this function correctly in ConfirmationPage
            const splitAmount = txb.pure.u64(amount);
            paymentCoin = txb.splitCoins(txb.gas, [splitAmount]);
            isSuiSplit = true;
        } else {
            paymentCoin = txb.object(coinId);
        }

        // Calling gasmeup::router::pay_for_gas<T>(payment: &mut Coin<T>, gas_budget_mist: u64)
        txb.moveCall({
            target: `${GASMEUP_PACKAGE_ID}::${GASMEUP_MODULE}::pay_for_gas`,
            typeArguments: [tokenType],
            arguments: [
                paymentCoin,
                txb.pure.u64(gasBudgetMist),
            ],
        });

        // If we split the coin, we must transfer it back to the user or destroy it if 0.
        // Since pay_for_gas takes &mut Coin and splits off the cost, the `paymentCoin` still holds
        // (Original Amount - Cost). Use transferObjects to send it back.
        if (isSuiSplit) {
            txb.transferObjects([paymentCoin], txb.pure.address(senderAddress));
        }

        return signAndExecute({
            transaction: txb,
        });
    };

    return { swapTokensForGas };
}
