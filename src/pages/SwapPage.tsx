import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClientQuery, ConnectModal } from '@mysten/dapp-kit';
import TokenInput from '../components/TokenInput';
import { USDC_TYPE, SUI_TYPE, FEE_PERCENT, USDC_TO_SUI_RATE, EXPECTED_GAS_COST_SUI, SUI_DECIMALS } from '../constants';

export default function SwapPage() {
    const navigate = useNavigate();
    const account = useCurrentAccount();
    const [payAmount, setPayAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');

    // Query user's USDC balance
    const { data: usdcCoins } = useSuiClientQuery('getCoins', {
        owner: account?.address || '',
        coinType: USDC_TYPE
    });

    // Calculate total USDC balance (6 decimals)
    const totalUsdcBalance = usdcCoins?.data.reduce((sum, coin) => sum + parseInt(coin.balance), 0) || 0;
    const displayBalance = (totalUsdcBalance / 1_000_000).toFixed(2);

    // Query user's SUI balance
    const { data: suiCoins } = useSuiClientQuery('getCoins', {
        owner: account?.address || '',
        coinType: SUI_TYPE
    });

    // Calculate total SUI balance (9 decimals)
    const totalSuiBalance = suiCoins?.data.reduce((sum, coin) => sum + parseInt(coin.balance), 0) || 0;
    const displaySuiBalance = (totalSuiBalance / Math.pow(10, SUI_DECIMALS)).toFixed(4);

    // Gas cost in USDC = gas_sui / rate
    const gasCostUsdc = EXPECTED_GAS_COST_SUI / USDC_TO_SUI_RATE;

    const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!/^\d*\.?\d*$/.test(val)) return;

        setPayAmount(val);
        if (val) {
            const usdcAmount = parseFloat(val);
            // 2% service fee
            const serviceFee = usdcAmount * FEE_PERCENT;
            // After fee and gas cost deduction
            const remaining = usdcAmount - serviceFee - gasCostUsdc;
            // Convert to SUI
            const suiOut = remaining > 0 ? remaining * USDC_TO_SUI_RATE : 0;
            setReceiveAmount(suiOut.toFixed(4));
        } else {
            setReceiveAmount('');
        }
    };

    const handleSwap = () => {
        navigate('/confirm', {
            state: {
                payAmount,
                receiveAmount,
            }
        });
    };

    return (
        <>
            <div className="flex flex-col gap-3 p-4 text-center mb-4">
                <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Swap USDC for SUI Gas</h1>
                <p className="text-slate-500 dark:text-[#9f9db9] text-base font-normal leading-normal">Instantly get SUI gas by swapping your USDC.</p>
                {!account && <p className="text-sm text-red-500 font-medium">Please connect your wallet to swap.</p>}
            </div>

            {/* Gas Price Info */}
            <div className="w-full mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Current Gas Price</p>
                        <p className="text-slate-900 dark:text-white text-xl font-bold">
                            ~{EXPECTED_GAS_COST_SUI} SUI <span className="text-sm font-normal text-slate-500">per transaction</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">≈ {(EXPECTED_GAS_COST_SUI / USDC_TO_SUI_RATE).toFixed(4)} USDC</p>
                    </div>
                </div>
            </div>

            <div className="flex w-full flex-col gap-2 rounded-lg bg-white/50 p-4 shadow-lg ring-1 ring-black/5 dark:bg-slate-800/50 backdrop-blur-sm">
                <TokenInput
                    label="You Pay"
                    balance={displayBalance}
                    tokenSymbol="USDC"
                    tokenIcon="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
                    showDropdown
                    value={payAmount}
                    onChange={handlePayChange}
                    disabled={!account}
                />

                {/* Swap Icon */}
                <div className="flex py-2 justify-center">
                    <button className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-800 dark:bg-slate-900 dark:text-white hover:rotate-180 transition-transform duration-300">
                        <span className="material-symbols-outlined text-2xl">arrow_downward</span>
                    </button>
                </div>

                <TokenInput
                    label="You Receive"
                    balance={displaySuiBalance}
                    tokenSymbol="SUI"
                    tokenIcon="https://cryptologos.cc/logos/sui-sui-logo.png"
                    readOnly
                    value={receiveAmount}
                />

                {/* Information Panel */}
                <div className="mt-4 flex flex-col gap-2 px-2 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Rate</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">1 USDC = {USDC_TO_SUI_RATE} SUI</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Service Fee</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                            {FEE_PERCENT * 100}%{payAmount ? ` (${(parseFloat(payAmount) * FEE_PERCENT).toFixed(4)} USDC)` : ''}
                        </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Gas Coverage</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{gasCostUsdc.toFixed(4)} USDC</span>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="mt-4">
                    {!account ? (
                        <ConnectModal
                            trigger={
                                <button
                                    className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
                                >
                                    <span className="truncate">Connect Wallet</span>
                                </button>
                            }
                        />
                    ) : (
                        <button
                            onClick={handleSwap}
                            disabled={!payAmount}
                            className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="truncate">GasMeUp!</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
