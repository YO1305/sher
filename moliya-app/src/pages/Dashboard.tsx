import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { BalanceCard } from '../components/dashboard/BalanceCard'
import { MonthSummary } from '../components/dashboard/MonthSummary'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { TransactionList } from '../components/transactions/TransactionList'

export function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 md:space-y-6">
      <BalanceCard />
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
