import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import SwapPage from './pages/SwapPage';
import ConfirmationPage from './pages/ConfirmationPage';
import ResultPage from './pages/ResultPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<SwapPage />} />
                    <Route path="/confirm" element={<ConfirmationPage />} />
                    <Route path="/result" element={<ResultPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
