import { useTranslation } from 'react-i18next'
import { TransactionList } from '../components/transactions/TransactionList'

export function Transactions() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight2">{t('nav.transactions')}</h2>
      <TransactionList />
    </div>
  )
}
