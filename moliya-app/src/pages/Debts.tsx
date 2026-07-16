import { useTranslation } from 'react-i18next'
import { DebtList } from '../components/debts/DebtList'

export function Debts() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight2">{t('nav.debts')}</h2>
      <DebtList />
    </div>
  )
}
