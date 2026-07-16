import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase()
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 min-h-[44px] w-full rounded-xl border border-border bg-surface2 px-3 text-slate-100 placeholder:text-muted/60 outline-none focus:border-primary ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-expense">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
