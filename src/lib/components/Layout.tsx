import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemePicker } from './ThemePicker';
import { NotificationBell } from './NotificationBell';

export default function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = pathname === to || (to === '/admin' && isAdmin);
    return (
      <Link to={to} title={label}
        className="relative p-2.5 rounded-xl transition-all duration-200"
        style={{ color: active ? 'var(--t-accent)' : 'var(--t-muted)' }}>
        {icon}
        {active && (
          <motion.span layoutId="nav-dot"
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: 'var(--t-accent)' }} />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--t-bg)', color: 'var(--t-text)' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b"
        style={{
          background: 'color-mix(in srgb, var(--t-bg) 88%, transparent)',
          borderColor: 'var(--t-border)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}>
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-md">
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
            <NavLink to="/"        icon={<Home             style={{ width: 18, height: 18 }} />} label="Home"    />
            <NavLink to="/profile" icon={<User             style={{ width: 18, height: 18 }} />} label="Profile" />
            <NavLink to="/admin"   icon={<LayoutDashboard  style={{ width: 18, height: 18 }} />} label="Admin"   />
            <NotificationBell />
            <ThemePicker />
          </nav>
        </div>
      </header>

      {/* Page with enter animation */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col flex-1">
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-8 mt-auto border-t print:hidden"
        style={{ background: 'var(--t-bg2)', borderColor: 'var(--t-border)' }}>
        <div className="max-w-md mx-auto px-4 text-center space-y-1.5">
          <p className="font-display text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--t-accent)' }}>Royal Quads Mambrui</p>
          <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>
            Yusuf Taib &nbsp;·&nbsp;
            <a href="tel:0784589999" style={{ color: 'var(--t-accent)' }}>0784 589 999</a>
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>
            Abubakar Bajaber &nbsp;·&nbsp;
            <a href="tel:0784993996" style={{ color: 'var(--t-accent)' }}>0784 993 996</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
