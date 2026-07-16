import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/formatCurrency'
import { useBalance } from '../../hooks/useBalance'

export function BalanceCard() {
  const { t } = useTranslation()
  const { balance } = useBalance()
  const positive = balance >= 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface2 p-5 md:p-6">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl ${
          positive ? 'bg-income' : 'bg-expense'
        }`}
      />
      <p className="text-sm text-muted">{t('balance.title')}</p>
      <p
        className={`mt-2 font-mono text-[36px] font-bold leading-none tracking-tight md:text-5xl ${
          positive ? 'text-income' : 'text-expense'
        }`}
      >
        {formatCurrency(balance)}
      </p>
      <p className="mt-2 text-sm text-muted">{t('som')}</p>
    </div>
  )
}
