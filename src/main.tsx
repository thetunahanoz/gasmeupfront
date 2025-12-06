import React from 'react'
import ReactDOM from 'react-dom/client'
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx'
import './index.css'
import '@mysten/dapp-kit/dist/index.css';

const { networkConfig } = createNetworkConfig({
    localnet: { url: getFullnodeUrl('localnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

import { ErrorBoundary } from './components/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
                    <WalletProvider>
                        <App />
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
