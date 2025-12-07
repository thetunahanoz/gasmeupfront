import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import TokenInput from '../components/TokenInput';
import { USDC_TYPE } from '../constants';

// Oracle price: 1 SUI = 10 USDC (simulated, matches contract)
const SUI_PRICE_USDC = 10;

// Protocol fee 5%
const FEE_PERCENT = 0.05;

// Profit markup 10%
const MARKUP_PERCENT = 0.10;

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

    const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!/^\d*\.?\d*$/.test(val)) return;

        setPayAmount(val);
        if (val) {
            const usdcAmount = parseFloat(val);
            // Calculate SUI: USDC / price, then apply markup and fee
            const baseSui = usdcAmount / SUI_PRICE_USDC;
            const afterMarkup = baseSui / (1 + MARKUP_PERCENT);
            const afterFee = afterMarkup * (1 - FEE_PERCENT);
            setReceiveAmount(afterFee.toFixed(4));
        } else {
            setReceiveAmount('');
        }
    };

    const handleSwap = () => {
        navigate('/confirm', {
            state: {
                payAmount,
                receiveAmount,
                tokenSymbol: 'USDC',
                receiveSymbol: 'SUI'
            }
        });
    };

    return (
        <>
            <div className="flex flex-col gap-3 p-4 text-center mb-4">
                <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Swap USDC for SUI Gas</h1>
                <p className="text-slate-500 dark:text-[#9f9db9] text-base font-normal leading-normal">Instantly get SUI gas by swapping your USDC.</p>
                {!account && <p className="text-sm text-red-500 font-medium">Please connect your wallet to swap.</p>}
                {account && <p className="text-xs text-slate-400 font-mono" title={account.address}>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>}
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
                    label="You Receive (SUI Gas)"
                    balance="-"
                    tokenSymbol="SUI"
                    tokenIcon="https://cryptologos.cc/logos/sui-sui-logo.png"
                    readOnly
                    value={receiveAmount}
                />

                {/* Information Panel */}
                <div className="mt-4 flex flex-col gap-2 px-2 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Rate</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">1 SUI ≈ {SUI_PRICE_USDC} USDC</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Service Fee</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{FEE_PERCENT * 100}%</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Markup</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{MARKUP_PERCENT * 100}%</span>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="mt-4">
                    <button
                        onClick={handleSwap}
                        disabled={!payAmount || !account}
                        className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="truncate">{!account ? 'Connect Wallet' : 'Get SUI Gas'}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
