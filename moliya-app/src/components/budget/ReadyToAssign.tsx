import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'

interface Props {
  amount: number
  compact?: boolean
}

export function ReadyToAssign({ amount, compact }: Props) {
  const { t } = useTranslation()
  const isZero = amount === 0
  const isOver = amount < 0
  const bg = isZero
    ? 'border-border bg-surface2'
    : isOver
      ? 'border-expense/40 bg-expense/10'
      : 'border-income/40 bg-income/10'
  const text = isZero ? 'text-slate-100' : isOver ? 'text-expense' : 'text-income'

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs uppercase tracking-wide text-muted">
        {t('ready_to_assign')}
      </p>
      <p className={`mt-1 font-mono text-3xl font-bold tracking-tight ${text}`}>
        {amount > 0 ? '+' : ''}
        {formatCurrency(amount)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {isZero
          ? t('ready_to_assign_zero')
          : isOver
            ? t('ready_to_assign_over')
            : t('ready_to_assign_hint')}
      </p>
      {!compact && !isZero && (
        <Link
          to="/budget"
          className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-primary/20 px-4 text-sm font-medium text-primary-light"
        >
          {t('assign')}
        </Link>
      )}
    </div>
  )
}
