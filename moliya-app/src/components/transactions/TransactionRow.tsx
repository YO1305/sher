import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '../../types'
import { getCategory } from '../../utils/categories'
import { formatCurrency } from '../../utils/formatCurrency'
import { useUiStore } from '../../store/uiStore'
import { useTransactionStore } from '../../store/transactionStore'

interface Props {
  transaction: Transaction
  runningBalance?: number
}

export function TransactionRow({ transaction, runningBalance }: Props) {
  const { t } = useTranslation()
  const openEdit = useUiStore((s) => s.openEditTransaction)
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction)
  const cat = getCategory(transaction.category)
  const Icon = cat?.icon

  return (
    <tr className="border-b border-border/60 hover:bg-surface2/50">
      <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">
        {dayjs(transaction.date).format('DD.MM.YYYY')}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${cat?.color ?? '#64748B'}22`, color: cat?.color }}
          >
            {Icon && <Icon size={16} />}
          </span>
          <span className="text-sm">{t(`category.${transaction.category}`)}</span>
        </div>
      </td>
      <td className="max-w-[160px] truncate px-3 py-3 text-sm">
        {transaction.counterparty || '—'}
      </td>
      <td className="max-w-[180px] truncate px-3 py-3 text-sm text-muted">
        {transaction.description || '—'}
      </td>
      <td
        className={`whitespace-nowrap px-3 py-3 text-right font-mono text-sm font-bold ${
          transaction.type === 'income' ? 'text-income' : 'text-expense'
        }`}
      >
        {transaction.type === 'income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-sm text-muted">
        {runningBalance !== undefined ? formatCurrency(runningBalance) : '—'}
      </td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(transaction)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-primary-light"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(t('confirmDelete'))) deleteTransaction(transaction.id)
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-expense"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}
