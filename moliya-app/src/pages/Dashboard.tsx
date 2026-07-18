import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, PiggyBank, Landmark, Users, UserMinus } from 'lucide-react'
import { BalanceCard } from '../components/dashboard/BalanceCard'
import { MonthSummary } from '../components/dashboard/MonthSummary'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { TransactionList } from '../components/transactions/TransactionList'
import { useSettingsStore } from '../store/settingsStore'
import { useTransactionStore } from '../store/transactionStore'
import { useDebts, useDebtStats } from '../hooks/useDebts'
import { useMonthStats } from '../hooks/useBalance'
import { sumCreditsDueThisMonth } from '../utils/creditSchedule'
import { formatCurrency } from '../utils/formatCurrency'

export function Dashboard() {
  const { t } = useTranslation()
  const savingsBalance = useSettingsStore((s) => s.savingsBalance)
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

  return (
    <div className="space-y-4 md:space-y-6">
      <BalanceCard />

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
            {formatCurrency(creditsDue, true)}
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
