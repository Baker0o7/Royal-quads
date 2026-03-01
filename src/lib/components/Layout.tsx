import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Home } from 'lucide-react';
import { cn } from '../utils';

export default function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-emerald-700 font-extrabold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-base shadow-sm">🏍️</span>
            ROYAL QUADS
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/"
              className={cn('p-2 rounded-full transition-colors', pathname === '/' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400 hover:bg-stone-100')}>
              <Home className="w-5 h-5" />
            </Link>
            <Link to="/profile"
              className={cn('p-2 rounded-full transition-colors', pathname === '/profile' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400 hover:bg-stone-100')}>
              <User className="w-5 h-5" />
            </Link>
            <Link to={isAdmin ? '/' : '/admin'}
              className={cn('p-2 rounded-full transition-colors', isAdmin ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400 hover:bg-stone-100')}>
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-5 mt-auto print:hidden">
        <div className="max-w-md mx-auto px-4 text-center text-xs space-y-1">
          <p className="font-semibold text-stone-300 tracking-widest text-xs uppercase mb-2">Royal Quads Mambrui</p>
          <p>Yusuf Taib: <a href="tel:0784589999" className="text-emerald-400 hover:text-emerald-300">0784589999</a></p>
          <p>Abubakar Bajaber: <a href="tel:0784993996" className="text-emerald-400 hover:text-emerald-300">0784993996</a></p>
        </div>
      </footer>
    </div>
  );
}
