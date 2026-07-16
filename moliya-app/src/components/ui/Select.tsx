import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.replace(/\s/g, '-').toLowerCase()
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm text-muted">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`h-11 min-h-[44px] w-full rounded-xl border border-border bg-surface2 px-3 text-slate-100 outline-none focus:border-primary ${className}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-expense">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
