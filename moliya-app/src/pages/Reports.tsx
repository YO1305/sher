import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useMonthStats } from '../hooks/useMonthStats'
import { CashflowChart } from '../components/dashboard/CashflowChart'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { formatCurrency } from '../utils/formatCurrency'
import { Button } from '../components/ui/Button'
import { exportToJson } from '../utils/exportImport'
import { useTransactionStore } from '../store/transactionStore'
import { useDebtStore } from '../store/debtStore'
import { useSettingsStore } from '../store/settingsStore'
import { ALL_CATEGORIES } from '../utils/categories'

export function Reports() {
  const { t } = useTranslation()
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const { income, expense, profit, byCategory, transactions } = useMonthStats(month)
  const allTx = useTransactionStore((s) => s.transactions)
  const debts = useDebtStore((s) => s.debts)
  const settings = useSettingsStore()

  const barData = useMemo(() => {
    const days = new Map<string, { day: string; income: number; expense: number }>()
    for (const tx of transactions) {
      const day = dayjs(tx.date).format('DD')
      const cur = days.get(day) ?? { day, income: 0, expense: 0 }
      if (tx.type === 'income') cur.income += tx.amount
      else cur.expense += tx.amount
      days.set(day, cur)
    }
    return Array.from(days.values()).sort((a, b) => a.day.localeCompare(b.day))
  }, [transactions])

  const categoryRows = useMemo(() => {
    return ALL_CATEGORIES.map((cat) => {
      const sum = transactions
        .filter((tx) => tx.category === cat.key)
        .reduce((s, tx) => s + tx.amount, 0)
      return { key: cat.key, type: cat.type, sum }
    }).filter((r) => r.sum > 0)
  }, [transactions])

  const shiftMonth = (dir: -1 | 1) => {
    setMonth(dayjs(month + '-01').add(dir, 'month').format('YYYY-MM'))
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight2">{t('reports.title')}</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            exportToJson({
              transactions: allTx,
              debts,
              settings: {
                userName: settings.userName,
                language: settings.language,
                initialBalance: settings.initialBalance,
                currency: settings.currency,
                onboardingDone: settings.onboardingDone,
              },
            })
          }
        >
          <Download size={16} />
          {t('settings.export')}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 rounded-xl bg-surface p-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface2 text-muted hover:text-slate-100"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="min-w-[140px] text-center font-semibold">
          {dayjs(month + '-01').format('MMMM YYYY')}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface2 text-muted hover:text-slate-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="rounded-xl bg-income/10 p-3">
          <p className="text-xs text-muted">{t('income')}</p>
          <p className="font-mono text-sm font-bold text-income md:text-lg">
            {formatCurrency(income, true)}
          </p>
        </div>
        <div className="rounded-xl bg-expense/10 p-3">
          <p className="text-xs text-muted">{t('expense')}</p>
          <p className="font-mono text-sm font-bold text-expense md:text-lg">
            {formatCurrency(expense, true)}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${profit >= 0 ? 'bg-income/10' : 'bg-expense/10'}`}>
          <p className="text-xs text-muted">{t('profit')}</p>
          <p
            className={`font-mono text-sm font-bold md:text-lg ${
              profit >= 0 ? 'text-income' : 'text-expense'
            }`}
          >
            {formatCurrency(profit, true)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">{t('incomeVsExpense')}</h3>
          <div className="h-56">
            {barData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {t('noTransactions')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke="#2E3348" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(v) => formatCurrency(Number(v), true)}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                    contentStyle={{
                      background: '#1A1D27',
                      border: '1px solid #2E3348',
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name={t('income')} fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t('expense')} fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <CashflowChart month={month} />
      </div>

      <CategoryChart month={month} />

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-surface2 px-4 py-3">
          <h3 className="text-sm font-semibold">{t('summary')}</h3>
        </div>
        <div className="divide-y divide-border">
          {categoryRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t('noTransactions')}</p>
          ) : (
            categoryRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{t(`category.${row.key}`)}</span>
                <span
                  className={`font-mono text-sm font-bold ${
                    row.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {formatCurrency(row.sum)}
                </span>
              </div>
            ))
          )}
          {Object.keys(byCategory).length > 0 && (
            <div className="flex items-center justify-between bg-surface2 px-4 py-3">
              <span className="text-sm font-semibold">{t('expense')}</span>
              <span className="font-mono text-sm font-bold text-expense">
                {formatCurrency(expense)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
