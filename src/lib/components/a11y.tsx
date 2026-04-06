import React from 'react';
import { clsx } from 'clsx';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ariaLabel?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ariaLabel,
  ...props
}: AccessibleButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-400',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function AccessibleInput({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: AccessibleInputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={clsx(
          'px-3 py-2 rounded-lg border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          error 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
          className
        )}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

interface AccessibleCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  role?: string;
}

export function AccessibleCard({ children, title, description, role = 'region' }: AccessibleCardProps) {
  return (
    <div 
      role={role}
      aria-labelledby={title ? undefined : undefined}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function SkipLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <a
      href={to}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg"
    >
      {children}
    </a>
  );
}
