import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Home, Sun, Moon } from 'lucide-react';
import { cn } from '../utils';
import { useTheme } from '../ThemeContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const isAdmin = pathname.startsWith('/admin');

  const navLink = (to: string, icon: React.ReactNode, label: string) => {
    const active = pathname === to || (to === '/admin' && isAdmin);
    return (
      <Link to={to} title={label}
        className={cn(
          'p-2.5 rounded-xl transition-all duration-200 relative',
          active
            ? 'text-[#c9972a] bg-[#c9972a]/10'
            : 'text-[#7a6e60] dark:text-[#a09070] hover:text-[#c9972a] hover:bg-[#c9972a]/5'
        )}>
        {icon}
        {active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#c9972a] rounded-full" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-[#0d0b09] text-[#1a1612] dark:text-[#f5f0e8] flex flex-col transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f5f0e8]/90 dark:bg-[#0d0b09]/90 backdrop-blur-md border-b border-[#c9b99a]/30 dark:border-[#c9b99a]/10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9972a] to-[#8a6010] flex items-center justify-center shadow-md group-hover:shadow-[#c9972a]/30 transition-shadow">
              <span className="text-sm">🏍️</span>
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-[#1a1612] dark:text-[#f5f0e8]">
                Royal Quads
              </span>
              <span className="block text-[9px] font-mono text-[#7a6e60] dark:text-[#a09070] leading-none tracking-[0.15em] uppercase -mt-0.5">
                Mambrui
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-0.5">
            {navLink('/', <Home className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />, 'Home')}
            {navLink('/profile', <User className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />, 'Profile')}
            {navLink(isAdmin ? '/' : '/admin', <LayoutDashboard style={{width:'18px',height:'18px'}} />, 'Admin')}
            <button onClick={toggle} title="Toggle theme"
              className="p-2.5 rounded-xl text-[#7a6e60] dark:text-[#a09070] hover:text-[#c9972a] hover:bg-[#c9972a]/5 transition-all duration-200">
              {theme === 'dark'
                ? <Sun style={{width:'18px',height:'18px'}} className="text-[#e8b84b]" />
                : <Moon style={{width:'18px',height:'18px'}} />}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-[#1a1612] dark:bg-[#0d0b09] text-[#7a6e60] py-8 mt-auto border-t border-[#2d2318] print:hidden">
        <div className="max-w-md mx-auto px-4 text-center space-y-2">
          <p className="font-display text-[#c9b99a] text-sm font-medium tracking-widest uppercase mb-3">
            Royal Quads Mambrui
          </p>
          <p className="text-xs font-mono">
            Yusuf Taib{' '}
            <a href="tel:0784589999" className="text-[#c9972a] hover:text-[#e8b84b] transition-colors">0784 589 999</a>
          </p>
          <p className="text-xs font-mono">
            Abubakar Bajaber{' '}
            <a href="tel:0784993996" className="text-[#c9972a] hover:text-[#e8b84b] transition-colors">0784 993 996</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
