import { useTranslation } from 'react-i18next'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import type { Debt } from '../../types'
import { formatCurrency } from '../../utils/formatCurrency'
import { Badge } from '../ui/Badge'
import { useDebtStore } from '../../store/debtStore'
import { useUiStore } from '../../store/uiStore'

interface Props {
  debt: Debt
}

export function DebtCard({ debt }: Props) {
  const { t } = useTranslation()
  const markPaid = useDebtStore((s) => s.markPaid)
  const deleteDebt = useDebtStore((s) => s.deleteDebt)
  const openEdit = useUiStore((s) => s.openEditDebt)

  const typeColor =
    debt.type === 'credit' ? '#F59E0B' : debt.type === 'lend' ? '#22C55E' : '#EF4444'

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 ${debt.isPaid ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold">{debt.name}</h3>
            <Badge color={typeColor}>{debt.isPaid ? t('paid') : t('active')}</Badge>
          </div>
          {debt.note && <p className="text-sm text-muted">{debt.note}</p>}
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-gold">
            {formatCurrency(debt.remainingAmount)}
          </p>
          <p className="text-xs text-muted">
            {t('totalAmount')}: {formatCurrency(debt.totalAmount)}
          </p>
        </div>
      </div>
      {debt.type === 'credit' && debt.monthlyPayment != null && (
        <p className="mt-2 text-sm text-muted">
          {t('monthlyPayment')}:{' '}
          <span className="font-mono text-slate-100">{formatCurrency(debt.monthlyPayment)}</span>
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {!debt.isPaid && (
          <button
            type="button"
            onClick={() => markPaid(debt.id)}
            className="flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-lg bg-income/15 text-sm text-income"
          >
            <CheckCircle2 size={14} />
            {t('markPaid')}
          </button>
        )}
        <button
          type="button"
          onClick={() => openEdit(debt.id)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface2 text-muted hover:text-primary-light"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('confirmDelete'))) deleteDebt(debt.id)
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface2 text-muted hover:text-expense"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
