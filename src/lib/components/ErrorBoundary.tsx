import * as React from 'react';

// Minimal error boundary — avoids class field syntax issues with useDefineForClassFields:false
export const ErrorBoundary: React.ComponentType<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = (function () {
  function EB(this: any, props: any) {
    React.Component.call(this, props);
    (this as any).state = { hasError: false, msg: '' };
  }
  EB.prototype = Object.create(React.Component.prototype);
  EB.prototype.constructor = EB;

  (EB as any).getDerivedStateFromError = (e: Error) => ({ hasError: true, msg: e.message });

  EB.prototype.componentDidCatch = function (e: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', e.message, info.componentStack?.slice(0, 200));
  };

  EB.prototype.render = function () {
    if ((this as any).state.hasError) {
      if ((this as any).props.fallback) return (this as any).props.fallback;
      return React.createElement(
        'div', { className: 'flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center' },
        React.createElement('div', { className: 'text-4xl' }, '⚠️'),
        React.createElement('div', null,
          React.createElement('h2', { className: 'font-display text-xl font-bold mb-2', style: { color: 'var(--t-text)' } }, 'Something went wrong'),
          React.createElement('p',  { className: 'text-sm font-mono mb-1', style: { color: '#ef4444' } }, (this as any).state.msg),
          React.createElement('p',  { className: 'text-xs', style: { color: 'var(--t-muted)' } }, 'Try refreshing the page.')
        ),
        React.createElement('div', { className: 'flex gap-3' },
          React.createElement('button', { onClick: () => window.location.reload(), className: 'btn-primary', style: { minWidth: 120 } }, 'Reload App'),
          React.createElement('button', {
            onClick: () => (this as any).setState({ hasError: false, msg: '' }),
            className: 'px-5 py-3 rounded-xl border text-sm font-semibold',
            style: { borderColor: 'var(--t-border)', color: 'var(--t-text)', background: 'var(--t-card)' }
          }, 'Dismiss')
        )
      );
    }
    return (this as any).props.children;
  };

  return EB as any;
}());
