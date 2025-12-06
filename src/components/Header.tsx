import { useState, useEffect } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';

export default function Header() {
    const [darkMode, setDarkMode] = useState(() => {
        // Check local storage or system preference
        if (localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return true;
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    return (
        <header className="flex h-20 w-full max-w-5xl items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                <div className="h-6 w-6">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                    </svg>
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">GasMeUp!</h2>
            </div>
            <div className="flex items-center gap-2">
                <ConnectButton
                    className="!bg-primary !text-white !font-bold !rounded-full !h-10 !px-4 !text-sm"
                    connectText="Connect Wallet"
                />
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">
                        {darkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </div>
        </header>
    );
}
