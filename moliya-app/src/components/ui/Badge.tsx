import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color = '#6366F1', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  )
}
