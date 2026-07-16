import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'income' | 'expense'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary hover:bg-primary-light text-white',
  secondary: 'bg-surface2 hover:bg-border text-slate-100',
  danger: 'bg-expense/20 hover:bg-expense/30 text-expense',
  ghost: 'bg-transparent hover:bg-surface2 text-muted',
  income: 'bg-income hover:bg-income/90 text-white',
  expense: 'bg-expense hover:bg-expense/90 text-white',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors min-h-[44px] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
