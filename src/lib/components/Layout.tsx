import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Home, Sun, Moon } from 'lucide-react';
import { cn } from '../utils';
import { useTheme } from '../ThemeContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-stone-900 shadow-sm dark:shadow-stone-800/50 sticky top-0 z-20 border-b border-transparent dark:border-stone-800">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-base shadow-sm">🏍️</span>
            ROYAL QUADS
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/"
              className={cn('p-2 rounded-full transition-colors',
                pathname === '/'
                  ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800')}>
              <Home className="w-5 h-5" />
            </Link>
            <Link to="/profile"
              className={cn('p-2 rounded-full transition-colors',
                pathname === '/profile'
                  ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800')}>
              <User className="w-5 h-5" />
            </Link>
            <Link to={isAdmin ? '/' : '/admin'}
              className={cn('p-2 rounded-full transition-colors',
                isAdmin
                  ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800')}>
              <LayoutDashboard className="w-5 h-5" />
            </Link>
            <button onClick={toggle}
              className="p-2 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-1"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-stone-900 dark:bg-stone-950 text-stone-400 py-5 mt-auto print:hidden border-t border-stone-800">
        <div className="max-w-md mx-auto px-4 text-center text-xs space-y-1">
          <p className="font-semibold text-stone-300 tracking-widest text-xs uppercase mb-2">Royal Quads Mambrui</p>
          <p>Yusuf Taib: <a href="tel:0784589999" className="text-emerald-400 hover:text-emerald-300">0784589999</a></p>
          <p>Abubakar Bajaber: <a href="tel:0784993996" className="text-emerald-400 hover:text-emerald-300">0784993996</a></p>
        </div>
      </footer>
    </div>
  );
}
