import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Home } from 'lucide-react';
import { ThemePicker } from './ThemePicker';

export default function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  const navLink = (to: string, icon: React.ReactNode, label: string) => {
    const active = pathname === to || (to === '/admin' && isAdmin);
    return (
      <Link to={to} title={label}
        className="p-2.5 rounded-xl transition-all duration-200 relative"
        style={{ color: active ? 'var(--t-accent)' : 'var(--t-muted)' }}>
        <span style={active ? { filter: 'drop-shadow(0 0 6px var(--t-accent))' } : undefined}>
          {icon}
        </span>
        {active && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: 'var(--t-accent)' }} />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ background: 'var(--t-bg)', color: 'var(--t-text)' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{ background: 'color-mix(in srgb, var(--t-bg) 90%, transparent)', borderColor: 'var(--t-border)' }}>
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all"
              style={{ background: `linear-gradient(135deg, var(--t-accent2), var(--t-accent))` }}>
              <span className="text-sm">🏍️</span>
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight" style={{ color: 'var(--t-text)' }}>
                Royal Quads
              </span>
              <span className="block text-[9px] font-mono leading-none tracking-[0.15em] uppercase -mt-0.5"
                style={{ color: 'var(--t-muted)' }}>
                Mambrui
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-0.5">
            {navLink('/', <Home style={{ width: 18, height: 18 }} />, 'Home')}
            {navLink('/profile', <User style={{ width: 18, height: 18 }} />, 'Profile')}
            {navLink(isAdmin ? '/' : '/admin', <LayoutDashboard style={{ width: 18, height: 18 }} />, 'Admin')}
            <ThemePicker />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col">
        <Outlet />
      </main>

      <footer className="py-8 mt-auto border-t print:hidden"
        style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)' }}>
        <div className="max-w-md mx-auto px-4 text-center space-y-2">
          <p className="font-display text-sm font-medium tracking-widest uppercase mb-3"
            style={{ color: 'var(--t-accent)' }}>
            Royal Quads Mambrui
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>
            Yusuf Taib{' '}
            <a href="tel:0784589999" style={{ color: 'var(--t-accent)' }}>0784 589 999</a>
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>
            Abubakar Bajaber{' '}
            <a href="tel:0784993996" style={{ color: 'var(--t-accent)' }}>0784 993 996</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
