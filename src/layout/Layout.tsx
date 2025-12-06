import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export default function Layout() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center">
            <Header />
            <main className="flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-0">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
