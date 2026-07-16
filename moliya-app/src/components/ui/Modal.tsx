import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  accent?: 'income' | 'expense' | 'default'
}

export function Modal({ open, onClose, title, children, footer, accent = 'default' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const accentBg =
    accent === 'income'
      ? 'bg-income/10'
      : accent === 'expense'
        ? 'bg-expense/10'
        : 'bg-surface'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border md:max-w-lg md:rounded-2xl ${accentBg}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
          <h2 className="text-lg font-bold tracking-tight2">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface2"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 md:px-5">{children}</div>
        {footer && <div className="border-t border-border px-4 py-3 md:px-5">{footer}</div>}
      </div>
    </div>
  )
}
