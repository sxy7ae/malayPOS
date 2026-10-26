import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="app">
            <header className="topbar">
                <strong className="brand">MalayPOS</strong>
                <nav>
                    <NavLink to="/barang">Data Barang</NavLink>
                    <span className="soon">Supplier</span>
                    <span className="soon">Penjualan</span>
                    <span className="soon">Pembelian</span>
                    <span className="soon">Laporan</span>
                </nav>
                <div className="who">
                    {user.fullName} ({user.role})
                    <button className="btn" onClick={handleLogout}>Keluar</button>
                </div>
            </header>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}