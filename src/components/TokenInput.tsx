import { ComponentProps } from 'react';

interface TokenInputProps extends ComponentProps<'input'> {
    label: string;
    balance?: string;
    tokenSymbol: string;
    tokenIcon?: string;
    showDropdown?: boolean;
}

export default function TokenInput({
    label,
    balance,
    tokenSymbol,
    tokenIcon,
    showDropdown = false,
    ...props
}: TokenInputProps) {
    return (
        <div className="rounded-lg bg-background-light p-4 dark:bg-background-dark">
            <div className="flex justify-between">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal pb-2">{label}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal pb-2">Balance: {balance || '0.00'}</p>
            </div>
            <div className="flex items-center gap-4">
                <input
                    className="w-full flex-1 appearance-none border-none bg-transparent p-0 text-3xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
                    placeholder="0.0"
                    type="text"
                    {...props}
                />
                <div className="relative">
                    <button className="flex h-10 items-center gap-2 rounded-full bg-slate-200 px-4 text-sm font-bold text-slate-800 dark:bg-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        {tokenIcon && <img className="h-5 w-5 rounded-full" src={tokenIcon} alt={`${tokenSymbol} logo`} />}
                        <span>{tokenSymbol}</span>
                        {showDropdown && <span className="material-symbols-outlined text-base">expand_more</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
