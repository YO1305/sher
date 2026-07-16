import { useTranslation } from 'react-i18next'
import { TrendingDown, TrendingUp, Scale } from 'lucide-react'
import { useMonthStats } from '../../hooks/useMonthStats'
import { formatCurrency } from '../../utils/formatCurrency'

export function MonthSummary() {
  const { t } = useTranslation()
  const { income, expense, profit } = useMonthStats()

  const items = [
    {
      label: t('income'),
      value: income,
      icon: TrendingUp,
      color: 'text-income',
      bg: 'bg-income/10',
    },
    {
      label: t('expense'),
      value: expense,
      icon: TrendingDown,
      color: 'text-expense',
      bg: 'bg-expense/10',
    },
    {
      label: t('profit'),
      value: profit,
      icon: Scale,
      color: profit >= 0 ? 'text-income' : 'text-expense',
      bg: profit >= 0 ? 'bg-income/10' : 'bg-expense/10',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`rounded-xl ${bg} p-3 md:p-4`}>
          <div className="mb-2 flex items-center gap-1.5 text-muted">
            <Icon size={14} className={color} />
            <span className="text-[10px] uppercase md:text-xs">{label}</span>
          </div>
          <p className={`font-mono text-sm font-bold md:text-lg ${color}`}>
            {formatCurrency(value, true)}
          </p>
        </div>
      ))}
    </div>
  )
}
