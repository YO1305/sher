import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '../../types'
import { getCategory } from '../../utils/categories'
import { formatCurrency } from '../../utils/formatCurrency'
import { Badge } from '../ui/Badge'
import { useUiStore } from '../../store/uiStore'
import { useTransactionStore } from '../../store/transactionStore'

interface Props {
  transaction: Transaction
  runningBalance?: number
}

export function TransactionCard({ transaction, runningBalance }: Props) {
  const { t } = useTranslation()
  const openEdit = useUiStore((s) => s.openEditTransaction)
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction)
  const cat = getCategory(transaction.category)
  const Icon = cat?.icon

  return (
    <div className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-surface px-3 py-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${cat?.color ?? '#64748B'}22`, color: cat?.color }}
      >
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {transaction.counterparty || t(`category.${transaction.category}`)}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge color={cat?.color}>{t(`category.${transaction.category}`)}</Badge>
              <span className="text-xs text-muted">{dayjs(transaction.date).format('DD.MM')}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`font-mono text-sm font-bold ${
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </p>
            {runningBalance !== undefined && (
              <p className="font-mono text-[10px] text-muted">{formatCurrency(runningBalance)}</p>
            )}
          </div>
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 flex translate-x-full items-center gap-1 bg-surface2 px-2 transition-transform group-focus-within:translate-x-0 group-hover:translate-x-0">
        <button
          type="button"
          onClick={() => openEdit(transaction)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-primary-light hover:bg-border"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('confirmDelete'))) deleteTransaction(transaction.id)
          }}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-expense hover:bg-border"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
