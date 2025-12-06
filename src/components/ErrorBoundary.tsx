import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-red-50 p-4 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
                    <p className="mt-2 text-slate-700">We encountered an error while rendering this page.</p>
                    <pre className="mt-4 max-w-2xl overflow-auto rounded bg-white p-4 text-left text-xs text-red-500 shadow border border-red-200">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        className="mt-6 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
