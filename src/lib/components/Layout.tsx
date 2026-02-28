import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bike, LayoutDashboard, User } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-emerald-700 font-bold text-xl tracking-tight">
            <img src="/logo.png" alt="Royal Quads" className="w-8 h-8 rounded-full object-cover border border-emerald-100 shadow-sm" />
            ROYAL QUADS
          </Link>
          <div className="flex items-center gap-2">
            <Link 
              to="/profile" 
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-500"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link 
              to={isAdmin ? "/" : "/admin"} 
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-500"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-6 mt-auto">
        <div className="max-w-md mx-auto px-4 text-center text-sm">
          <p className="font-medium text-stone-300 mb-2">ROYAL QUADS MAMBRUI</p>
          <p>Yusuf Taib: <a href="tel:0784589999" className="text-emerald-500">0784589999</a></p>
          <p>Abubakar Bajaber: <a href="tel:0784993996" className="text-emerald-500">0784993996</a></p>
        </div>
      </footer>
    </div>
  );
}
