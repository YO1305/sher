import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { CheckCircle2, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import type { Debt } from '../../types'
import { formatCurrency } from '../../utils/formatCurrency'
import { Badge } from '../ui/Badge'
import { useDebtStore } from '../../store/debtStore'
import { useTransactionStore } from '../../store/transactionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUiStore } from '../../store/uiStore'
import { getDebtHistory } from '../../utils/debtSync'
import { getCategoryLabel } from '../../utils/categoryHelpers'
import { formatCreditLabel, getCreditDueInfo } from '../../utils/creditSchedule'

interface Props {
  debt: Debt
}

export function DebtCard({ debt }: Props) {
  const { t } = useTranslation()
  const markPaid = useDebtStore((s) => s.markPaid)
  const deleteDebt = useDebtStore((s) => s.deleteDebt)
  const openEdit = useUiStore((s) => s.openEditDebt)
  const transactions = useTransactionStore((s) => s.transactions)
  const banks = useSettingsStore((s) => s.banks)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)
  const [expanded, setExpanded] = useState(false)

  const history = useMemo(
    () => getDebtHistory(transactions, debt.name, debt.id),
    [transactions, debt.name, debt.id],
  )

  const bankName = banks.find((b) => b.id === debt.bankId)?.name
  const due =
    debt.type === 'credit' && !debt.isPaid
      ? getCreditDueInfo(debt, transactions)
      : null

  const typeColor =
    debt.type === 'credit' ? '#F59E0B' : debt.type === 'lend' ? '#22C55E' : '#EF4444'

  const title =
    debt.type === 'credit'
      ? formatCreditLabel(debt, bankName)
      : debt.name

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 ${debt.isPaid ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <Badge color={typeColor}>{debt.isPaid ? t('paid') : t('active')}</Badge>
          </div>
          {debt.note && <p className="text-sm text-muted">{debt.note}</p>}
          {debt.type === 'credit' && debt.monthsTotal != null && (
            <p className="mt-1 text-xs text-muted">
              {t('monthsTotal')}: {debt.monthsTotal}
              {due ? ` · ${t('monthsElapsed')}: ${due.monthsElapsed}` : ''}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg font-bold text-gold">
            {formatCurrency(debt.remainingAmount)}
          </p>
          <p className="text-xs text-muted">
            {t('totalAmount')}: {formatCurrency(debt.totalAmount)}
          </p>
        </div>
      </div>

      {debt.type === 'credit' && debt.monthlyPayment != null && (
        <div className="mt-2 space-y-1 text-sm text-muted">
          <p>
            {t('monthlyPayment')}:{' '}
            <span className="font-mono text-slate-100">
              {formatCurrency(debt.monthlyPayment)}
            </span>
          </p>
          {due && due.dueThisMonth > 0 && (
            <p className="text-amber-300">
              {t('dueThisMonth')}:{' '}
              <span className="font-mono font-semibold">
                {formatCurrency(due.dueThisMonth)}
              </span>
              {due.overdue > 0 && (
                <span className="ml-1 text-xs text-expense">
                  ({t('overdue')}: {formatCurrency(due.overdue)})
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-h-[44px] w-full items-center justify-between text-sm text-muted hover:text-slate-100"
          >
            <span>
              {t('debtHistory')} ({history.length})
            </span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expanded && (
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {history.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-start justify-between gap-2 rounded-lg bg-surface2 px-2.5 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100">
                      {getCategoryLabel(tx.category, t, overrides, custom)}
                    </p>
                    <p className="text-muted">
                      {dayjs(tx.date).format('DD.MM.YYYY')}
                      {tx.description ? ` · ${tx.description}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono font-semibold ${
                      tx.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {!debt.isPaid && debt.remainingAmount > 0 && (
          <button
            type="button"
            onClick={() => markPaid(debt.id)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg bg-income/15 text-sm text-income"
          >
            <CheckCircle2 size={14} />
            {t('markPaid')}
          </button>
        )}
        {(debt.source !== 'auto' || debt.type === 'credit') && (
          <>
            <button
              type="button"
              onClick={() => openEdit(debt.id)}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface2 text-muted hover:text-primary-light"
            >
              <Pencil size={14} />
            </button>
            {debt.source !== 'auto' && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('confirmDelete'))) deleteDebt(debt.id)
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface2 text-muted hover:text-expense"
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
