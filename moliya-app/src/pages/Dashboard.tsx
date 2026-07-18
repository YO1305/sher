import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  PiggyBank,
  Landmark,
  Users,
  UserMinus,
  AlertTriangle,
} from 'lucide-react'
import { BalanceCard } from '../components/dashboard/BalanceCard'
import { MonthSummary } from '../components/dashboard/MonthSummary'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { TransactionList } from '../components/transactions/TransactionList'
import { useSettingsStore } from '../store/settingsStore'
import { useTransactionStore } from '../store/transactionStore'
import { useDebts, useDebtStats } from '../hooks/useDebts'
import { useMonthStats } from '../hooks/useBalance'
import { sumCreditsDueThisMonth } from '../utils/creditSchedule'
import { collectDueAlerts } from '../utils/cardDebt'
import { formatCurrency } from '../utils/formatCurrency'
import dayjs from 'dayjs'

export function Dashboard() {
  const { t } = useTranslation()
  const savingsBalance = useSettingsStore((s) => s.savingsBalance)
  const creditCards = useSettingsStore((s) => s.creditCards)
  const transactions = useTransactionStore((s) => s.transactions)
  const debts = useDebts()
  const stats = useDebtStats()
  const { profit } = useMonthStats()

  const creditsDue = useMemo(
    () =>
      sumCreditsDueThisMonth(
        debts.filter((d) => d.type === 'credit'),
        transactions,
      ),
    [debts, transactions],
  )

  const alerts = useMemo(
    () => collectDueAlerts(debts, creditCards, transactions, 3),
    [debts, creditCards, transactions],
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <BalanceCard />

      {alerts.length > 0 && (
        <div className="space-y-2 rounded-xl border border-expense/40 bg-expense/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-expense">
            <AlertTriangle size={16} />
            {t('alerts.urgentTitle')}
          </div>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={`${a.kind}-${a.id}`}>
                <Link
                  to="/debts"
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg bg-surface/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-[10px] text-muted">
                      {a.daysLeft < 0
                        ? t('alerts.overdueBy', { days: Math.abs(a.daysLeft) })
                        : a.daysLeft === 0
                          ? t('alerts.dueToday')
                          : t('alerts.dueIn', { days: a.daysLeft })}
                      {' · '}
                      {dayjs(a.dueDate).format('DD.MM')}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-expense">
                    {formatCurrency(a.amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl bg-teal-500/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
            <PiggyBank size={12} />
            {t('savings')}
          </div>
          <p className="font-mono text-sm font-bold text-teal-400 md:text-base">
            {formatCurrency(savingsBalance, true)}
          </p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
            <Landmark size={12} />
            {t('dueThisMonth')}
          </div>
          <p className="font-mono text-sm font-bold text-amber-400 md:text-base">
            {formatCurrency(creditsDue + stats.card, true)}
          </p>
        </div>
        <Link to="/debts" className="rounded-xl bg-income/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
            <Users size={12} />
            {t('lend')}
          </div>
          <p className="font-mono text-sm font-bold text-income md:text-base">
            {formatCurrency(stats.lend, true)}
          </p>
        </Link>
        <Link to="/debts" className="rounded-xl bg-expense/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
            <UserMinus size={12} />
            {t('owe')}
          </div>
          <p className="font-mono text-sm font-bold text-expense md:text-base">
            {formatCurrency(stats.owe, true)}
          </p>
        </Link>
      </div>

      {profit > 0 && (
        <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted">
          {t('savings.monthHint', { amount: formatCurrency(profit) })}
        </p>
      )}

      <MonthSummary />
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChart />
        <div className="rounded-xl bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('recent')}</h3>
            <Link
              to="/transactions"
              className="flex min-h-[44px] items-center gap-1 text-sm text-primary-light"
            >
              {t('seeAll')}
              <ChevronRight size={16} />
            </Link>
          </div>
          <TransactionList limit={5} showFilters={false} />
        </div>
      </div>
    </div>
  )
}
