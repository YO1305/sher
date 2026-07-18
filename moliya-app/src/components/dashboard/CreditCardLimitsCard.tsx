import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { useCreditCardLimits } from '../../hooks/useCreditCardLimits'

export function CreditCardLimitsCard() {
  const { t } = useTranslation()
  const { items, totalAvailable } = useCreditCardLimits()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface2 p-5 md:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-slate-400/15 opacity-20 blur-2xl" />

      <div className="flex items-center gap-2">
        <CreditCard size={14} className="text-muted" />
        <p className="text-sm text-muted">{t('dashboard.cardLimits')}</p>
      </div>

      <p className="mt-2 font-mono text-[36px] font-bold leading-none tracking-tight text-slate-100 md:text-5xl">
        {formatCurrency(totalAvailable)}
      </p>
      <p className="mt-2 text-sm text-muted">{t('som')}</p>

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border/60 pt-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex min-h-[36px] items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0 truncate text-muted">
                {item.bankName && item.bankName !== item.name
                  ? `${item.bankName} · ${item.name}`
                  : item.name}
              </span>
              <span className="shrink-0 font-mono font-medium text-slate-200">
                {formatCurrency(item.available)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-muted">
          {t('dashboard.cardLimitsEmpty')}{' '}
          <Link to="/settings" className="text-primary-light hover:underline">
            {t('nav.settings')}
          </Link>
        </p>
      )}
    </div>
  )
}
