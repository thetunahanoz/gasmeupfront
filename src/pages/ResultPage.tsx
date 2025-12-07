import { useLocation, useNavigate } from 'react-router-dom';
import { useSuiClientContext } from '@mysten/dapp-kit';

export default function ResultPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { network } = useSuiClientContext();

    const success = location.state?.success ?? true;
    const digest = location.state?.digest;
    const error = location.state?.error;

    const networkPath = network === 'mainnet' ? 'mainnet' : 'testnet';
    const suiScanUrl = digest ? `https://suiscan.xyz/${networkPath}/tx/${digest}` : null;

    if (success) {
        return (
            <div className="flex w-full max-w-md flex-col items-center justify-center gap-8 rounded-xl bg-white/80 dark:bg-slate-800/80 p-8 text-center ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm shadow-lg">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-500 dark:text-green-400 animate-bounce-slow">
                    <span className="material-symbols-outlined !text-6xl">check_circle</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Successful!</h1>
                    <p className="max-w-xs text-sm text-slate-600 dark:text-white/60">Your SUI gas tokens have been successfully added to your wallet.</p>
                </div>
                <div className="flex w-full flex-col items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-base font-bold text-white transition-all hover:bg-primary/90"
                    >
                        <span className="truncate">Back to Home</span>
                    </button>
                    {suiScanUrl && (
                        <a
                            href={suiScanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent text-sm font-bold leading-normal tracking-[0.015em] text-slate-600 dark:text-white/70 transition-colors hover:text-slate-900 dark:hover:text-white"
                        >
                            <span className="truncate">View on SuiScan</span>
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full max-w-md flex-col items-center justify-center gap-8 rounded-xl bg-white/80 dark:bg-slate-800/80 p-8 text-center ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm shadow-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:text-red-400">
                <span className="material-symbols-outlined !text-6xl">error</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Failed</h1>
                <p className="max-w-xs text-sm text-slate-600 dark:text-white/60">
                    {error || 'Transaction failed. Please check your balance and try again.'}
                </p>
            </div>
            <div className="flex w-full flex-col items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-base font-bold text-white transition-all hover:bg-primary/90"
                >
                    <span className="truncate">Try Again</span>
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="flex h-12 w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent text-sm font-bold leading-normal tracking-[0.015em] text-slate-600 dark:text-white/70 transition-colors hover:text-slate-900 dark:hover:text-white"
                >
                    <span className="truncate">Back to Home</span>
                </button>
            </div>
        </div>
    );
}
