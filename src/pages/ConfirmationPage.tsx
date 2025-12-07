import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClientQuery, useSuiClient } from '@mysten/dapp-kit';
import { useSwapTransaction } from '../hooks/useSwapTransaction';
import {
    USDC_TYPE,
    USDC_DECIMALS,
    SUI_DECIMALS,
    FEE_PERCENT,
    USDC_TO_SUI_RATE,
    TYPICAL_GAS_UNITS,
    SAFE_GAS_MULTIPLIER,
    FALLBACK_MIN_SUI,
    EXPECTED_GAS_COST_SUI,
} from '../constants';

export default function ConfirmationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { payAmount, receiveAmount } = location.state || { payAmount: '0', receiveAmount: '0' };

    const { swapUsdcForSui } = useSwapTransaction();
    const account = useCurrentAccount();
    const suiClient = useSuiClient();

    // Query user's USDC coins
    const { data: coins } = useSuiClientQuery('getCoins', {
        owner: account?.address || '',
        coinType: USDC_TYPE
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [safeGasAmount, setSafeGasAmount] = useState<bigint>(FALLBACK_MIN_SUI);

    // Gas cost in USDC = gas_sui / rate
    const gasCostUsdc = EXPECTED_GAS_COST_SUI / USDC_TO_SUI_RATE;

    // Fetch reference gas price on mount
    useEffect(() => {
        const fetchGasPrice = async () => {
            try {
                const gasPrice = await suiClient.getReferenceGasPrice();
                const safeGas = BigInt(Math.floor(
                    Number(gasPrice) * Number(TYPICAL_GAS_UNITS) * SAFE_GAS_MULTIPLIER
                ));
                setSafeGasAmount(safeGas);
            } catch (error) {
                console.warn('Failed to fetch gas price, using fallback:', error);
                setSafeGasAmount(FALLBACK_MIN_SUI);
            }
        };
        fetchGasPrice();
    }, [suiClient]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            if (!coins || coins.data.length === 0) {
                alert("No USDC found in wallet!");
                return;
            }

            const requiredAmount = Number(payAmount) * Math.pow(10, USDC_DECIMALS);

            // Find a USDC coin with enough balance
            const coinToPay = coins.data.find(c => parseInt(c.balance) >= requiredAmount);

            if (!coinToPay) {
                alert(`Insufficient USDC balance! You need at least ${payAmount} USDC.`);
                return;
            }

            // Calculate expected SUI output
            const expectedSui = BigInt(Math.floor(Number(receiveAmount) * Math.pow(10, SUI_DECIMALS)));

            // Apply 5% slippage tolerance
            const withSlippage = (expectedSui * 95n) / 100n;

            // minSuiOut = max(slippage_adjusted, safe_gas_amount)
            const minSuiOut = withSlippage > safeGasAmount ? withSlippage : safeGasAmount;

            // Check if expected output meets safe gas threshold
            if (expectedSui < safeGasAmount) {
                const safeGasSui = Number(safeGasAmount) / Math.pow(10, SUI_DECIMALS);
                alert(`Swap amount too small! You would receive ${receiveAmount} SUI, but you need at least ${safeGasSui.toFixed(4)} SUI to cover future gas fees.`);
                return;
            }

            // Call the swap function
            const result = await swapUsdcForSui(
                coinToPay.coinObjectId,
                requiredAmount,
                Number(minSuiOut),
                account?.address || ''
            );

            if (result.success) {
                navigate('/result', { state: { success: true, digest: result.digest } });
            } else {
                console.error("Swap failed:", result.error);
                navigate('/result', { state: { success: false, error: result.error } });
            }
        } catch (error) {
            console.error("Swap failed", error);
            navigate('/result', { state: { success: false } });
        } finally {
            setIsProcessing(false);
        }
    };

    const safeGasDisplay = (Number(safeGasAmount) / Math.pow(10, SUI_DECIMALS)).toFixed(6);

    return (
        <div className="relative flex w-full flex-col items-center justify-center">
            <div className="w-full max-w-lg rounded-xl bg-[#1A1B23]/80 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-white/10">
                    <p className="text-white text-xl font-bold leading-tight">Confirm Swap</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#2a2839] text-white/80 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="p-2 sm:p-4">
                    {/* You Pay (USDC) */}
                    <div className="p-4 @container">
                        <div className="flex flex-col items-stretch justify-start rounded-xl sm:flex-row sm:items-center bg-[#2D2F3D]/50 p-4">
                            <div
                                className="w-12 h-12 bg-center bg-no-repeat bg-contain rounded-full flex-shrink-0 mb-3 sm:mb-0"
                                style={{ backgroundImage: 'url("https://cryptologos.cc/logos/usd-coin-usdc-logo.png")' }}
                            ></div>
                            <div className="flex w-full min-w-0 grow flex-col items-stretch justify-center gap-1 sm:px-4">
                                <p className="text-[#A0A0A0] text-sm font-normal leading-normal">You Pay</p>
                                <p className="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">{payAmount} USDC</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[#9f9db9] text-2xl font-normal leading-normal py-2 text-center">↓</p>

                    {/* You Receive (SUI) */}
                    <div className="p-4 @container">
                        <div className="flex flex-col items-stretch justify-start rounded-xl sm:flex-row sm:items-center bg-[#2D2F3D]/50 p-4">
                            <div
                                className="w-12 h-12 bg-center bg-no-repeat bg-contain rounded-full flex-shrink-0 mb-3 sm:mb-0"
                                style={{ backgroundImage: 'url("https://cryptologos.cc/logos/sui-sui-logo.png")' }}
                            ></div>
                            <div className="flex w-full min-w-0 grow flex-col items-stretch justify-center gap-1 sm:px-4">
                                <p className="text-[#A0A0A0] text-sm font-normal leading-normal">You Receive (Est.)</p>
                                <p className="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">{receiveAmount} SUI</p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6">
                        <div className="flex justify-between gap-x-6 py-2 border-b border-white/10">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Rate</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">1 USDC = {USDC_TO_SUI_RATE} SUI</p>
                        </div>
                        <div className="flex justify-between gap-x-6 py-2 border-b border-white/10">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Service Fee</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">{FEE_PERCENT * 100}%</p>
                        </div>
                        <div className="flex justify-between gap-x-6 py-2 border-b border-white/10">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Gas Coverage</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">{gasCostUsdc.toFixed(4)} USDC</p>
                        </div>
                        <div className="flex justify-between gap-x-6 py-2 border-b border-white/10">
                            <p className="text-[#A0A0A0] text-sm font-normal leading-normal">Min. for Gas</p>
                            <p className="text-white text-sm font-medium leading-normal text-right">{safeGasDisplay} SUI</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={isProcessing}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-transparent text-white/90 text-base font-medium leading-normal border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <span className="truncate">Cancel</span>
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-medium leading-normal hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                    >
                        <span className="truncate">{isProcessing ? 'Processing...' : 'Confirm Swap'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
