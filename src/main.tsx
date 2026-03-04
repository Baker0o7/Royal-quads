import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './lib/ThemeContext.tsx';
import { ToastProvider } from './lib/components/Toast.tsx';
import { ErrorBoundary } from './lib/components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
