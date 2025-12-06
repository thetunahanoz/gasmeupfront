import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import TokenInput from '../components/TokenInput';

const SUI_PRICE_USDT = 1; // 1:1 for SUI demo

const FEE_PERCENT = 0.003; // 0.3%

export default function SwapPage() {
    const navigate = useNavigate();
    const account = useCurrentAccount();
    const [payAmount, setPayAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');

    const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!/^\d*\.?\d*$/.test(val)) return;

        setPayAmount(val);
        if (val) {
            const numVal = parseFloat(val);
            const amountInSui = numVal / SUI_PRICE_USDT;
            const fee = amountInSui * FEE_PERCENT;
            const finalSui = amountInSui - fee;
            setReceiveAmount(finalSui.toFixed(4));
        } else {
            setReceiveAmount('');
        }
    };

    const handleSwap = () => {
        // Navigate to confirmation with state
        navigate('/confirm', {
            state: {
                payAmount,
                receiveAmount,
                tokenSymbol: 'USDT',
                receiveSymbol: 'SUI'
            }
        });
    };

    return (
        <>
            <div className="flex flex-col gap-3 p-4 text-center mb-4">
                <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Swap Tokens for Gas</h1>
                <p className="text-slate-500 dark:text-[#9f9db9] text-base font-normal leading-normal">Instantly get SUI gas by swapping any supported token.</p>
                {!account && <p className="text-sm text-red-500 font-medium">Please connect your wallet to swap.</p>}
                {account && <p className="text-xs text-slate-400 font-mono" title={account.address}>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>}
            </div>

            <div className="flex w-full flex-col gap-2 rounded-lg bg-white/50 p-4 shadow-lg ring-1 ring-black/5 dark:bg-slate-800/50 backdrop-blur-sm">
                <TokenInput
                    label="Gönderilecek Token"
                    balance={account ? "1,240.50" : "0.00"} // Mock balance for now, would be fetched from chain
                    tokenSymbol="SUI (Demo)"
                    tokenIcon="https://lh3.googleusercontent.com/aida-public/AB6AXuBqqKdDSim7kC3zmMTjESd7HGgX05d47ylIh1OCjsH5Ap02R2m5P_850y-Rl1HXJ4Jw-L9Gs48K9On82ExAPwmaGoqum_lUHMcJiB65CNTXMImvWHc4hR7KWyl2Hf5tq-DDmz7LWJ5a7q0kUBYXE6G55_3HAui6-aqDr80_fskNbyaOcCavGjY7sr00zCdT2wuXHa9ZoYfZZ9X9gyKFFaXCWiTXR_8G64lTfvgcl_UHG1g2Ik4tCLUToVB7-RCJVnsXIBOXSN0KudwX"
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
                    label="Alınacak Gas (SUI)"
                    balance="2.15"
                    tokenSymbol="SUI"
                    tokenIcon="https://lh3.googleusercontent.com/aida-public/AB6AXuBQQtBoYSduDexH3QoJUnLySANTkBa0yXd44ZbZYklwh2t8Xw2gQTPFrvxcCGjcRiPNhdxnWxbgowOmFfOIEsH7zA75dIUWXZjjAusPBy4ML6Mm070SLIzDbvyAGFT0OVfYisG-Jsjl4kZICz0JviNoY5A7oeEobx9RUDfNxSgInNTmQ9CtZXWvhiAyOa3qr1mnYlrXDL_3zEMSCGimbttX4zEOiuwD86mJsZr63U6dsHf-mBAxlhLOgWHT3FzplsL9fobg4Zsm-IzD"
                    readOnly
                    value={receiveAmount}
                />

                {/* Information Panel */}
                <div className="mt-4 flex flex-col gap-2 px-2 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Price</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">1 SUI = {SUI_PRICE_USDT} USDT</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Service Fee</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{FEE_PERCENT * 100}%</span>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="mt-4">
                    <button
                        onClick={handleSwap}
                        disabled={!payAmount || !account}
                        className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="truncate">{!account ? 'Cüzdanı Bağla' : 'Gas Al'}</span>
                    </button>
                </div>
            </div>
        </>
    );
}
