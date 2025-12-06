import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { useSwapTransaction } from '../hooks/useSwapTransaction';
import { USDT_TYPE } from '../constants';

export default function ConfirmationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { payAmount, receiveAmount } = location.state || { payAmount: '0', receiveAmount: '0' };

    const { swapTokensForGas } = useSwapTransaction();
    const account = useCurrentAccount();
    const { data: coins } = useSuiClientQuery('getCoins', {
        owner: account?.address || '',
        coinType: USDT_TYPE
    });

    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            if (!coins || coins.data.length === 0) {
                alert("No SUI/Token coins found in wallet!");
                return;
            }

            // Simple MVP selection: Pick first coin with enough balance
            // In product: Merge coins or select best fit
            // GASMEUP FIX: We must leave enough gas (e.g. 0.5 SUI) in the object if we are splitting from it.
            const GAS_BUFFER_MIST = 500_000_000; // 0.5 SUI
            const requiredAmount = Number(payAmount) * 1_000_000_000 + GAS_BUFFER_MIST;

            const coinToPay = coins.data.find(c => parseInt(c.balance) > requiredAmount);

            if (!coinToPay) {
                alert(`Insufficient balance! You need at least ${payAmount} SUI + 0.5 SUI for gas in a single object.`);
                return;
            }

            const mockCoinId = coinToPay.coinObjectId;

            await swapTokensForGas(
                USDT_TYPE,
                mockCoinId,
                Number(payAmount) * 1_000_000_000,
                Number(receiveAmount) * 1_000_000_000 * 0.95,
                account?.address || ''
            );

            navigate('/result', { state: { success: true } });
        } catch (error) {
            console.error("Swap failed", error);
            navigate('/result', { state: { success: false } });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="relative flex w-full flex-col items-center justify-center">
            <div className="w-full max-w-lg rounded-xl bg-[#1A1B23]/80 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
                {/* PageHeading Component */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-white/10">
                    <p className="text-white text-xl font-bold leading-tight">İşlemi Onayla</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#2a2839] text-white/80 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="p-2 sm:p-4">
                    {/* Card Component: Amount to Pay */}
                    <div className="p-4 @container">
                        <div className="flex flex-col items-stretch justify-start rounded-xl sm:flex-row sm:items-center bg-[#2D2F3D]/50 p-4">
                            <div
                                className="w-12 h-12 bg-center bg-no-repeat bg-contain rounded-full flex-shrink-0 mb-3 sm:mb-0 bg-white"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8Nq1ROTrRFk4vKqkxZ7snTinHOs3CiiWPFa9qyp8Od8fmL0LNNsHpAdd4X2wiOEGRpvjCToYlKJ2lgtG30la-6KHoodSfkyXUQ-RvHa6Rb3KsM2wPb-pe00ka7acfaykq8ETFi0eA1HTe9wqOIhCYVmLdTxOe3r1pc7Jz-IFF_2qoigeUJ_37NCutaSrUtIfiotUB8ZKsKtuHJfa1uzJGoKk1ptKCiFUHDIewS5eJH4Z8XpG_Llt1fsnexbsdzYNhtjfjuUGnq8eT")' }}
                            ></div>
                            <div className="flex w-full min-w-0 grow flex-col items-stretch justify-center gap-1 sm:px-4">
                                <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Ödeyeceğin Tutar</p>
                                <p className="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">{payAmount} SUI (Demo)</p>
                            </div>
                        </div>
                    </div>

                    {/* MetaText Component: Swap Arrow */}
                    <p className="text-[#9f9db9] text-2xl font-normal leading-normal py-2 text-center">↓</p>

                    {/* Card Component: Amount to Receive */}
                    <div className="p-4 @container">
                        <div className="flex flex-col items-stretch justify-start rounded-xl sm:flex-row sm:items-center bg-[#2D2F3D]/50 p-4">
                            <div
                                className="w-12 h-12 bg-center bg-no-repeat bg-contain rounded-full flex-shrink-0 mb-3 sm:mb-0 bg-white"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD1jkCgW_DrHQkAWwpKjGiVlzPg1tWilcYOs1Z10ivDwPKj18r3L-ERui9QYnu0TDJVhT-Py-tHP5h4lWg2FgkAkORZ0jOfMwr89YHyVl0xmyubi5cm9GkbzFlhLWOhPMExDT-7lm7JSwCzbizmxxSiB-HlkQGw-E4RumLGnsJguAMINnPC2X172qmh7qIEpowees85nheI_5o5nP_aHcoeAXiky40E_NPUzuXN5yo0UHEQuxdyxyVNfWNGixRdTAZdqDHZNbVwjGBY")' }}
                            ></div>
                            <div className="flex w-full min-w-0 grow flex-col items-stretch justify-center gap-1 sm:px-4">
                                <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Alacağın Tutar (Tahmini)</p>
                                <p className="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">{receiveAmount} SUI</p>
                            </div>
                        </div>
                    </div>

                    {/* DescriptionList Component */}
                    <div className="p-6">
                        <div className="flex justify-between gap-x-6 py-2 border-b border-white/10">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">1 USDT</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">~0.79 SUI</p>
                        </div>
                        <div className="flex justify-between gap-x-6 py-2 border-b border-white/10">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">GasMeUp! Komisyonu (0.3%)</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">Included</p>
                        </div>
                        <div className="flex justify-between gap-x-6 pt-2">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Toplam Maliyet</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">{payAmount} SUI (Demo)</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={isProcessing}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-transparent text-white/90 text-base font-medium leading-normal border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <span className="truncate">İptal Et</span>
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-medium leading-normal hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                    >
                        <span className="truncate">{isProcessing ? 'İşleniyor...' : 'Onayla ve Cüzdana Gönder'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
