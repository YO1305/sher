import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useBalance } from '../../hooks/useBalance'
import { formatCurrency } from '../../utils/formatCurrency'

interface Props {
  month?: string
}

export function CashflowChart({ month }: Props) {
  const { t } = useTranslation()
  const target = month ?? dayjs().format('YYYY-MM')
  const { withBalance } = useBalance()

  const data = useMemo(() => {
    const monthTxs = withBalance.filter((tx) => tx.date.startsWith(target))
    if (monthTxs.length === 0) return []

    const byDay = new Map<string, number>()
    for (const tx of monthTxs) {
      byDay.set(tx.date, tx.runningBalance)
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, balance]) => ({
        date: dayjs(date).format('DD'),
        balance,
      }))
  }, [withBalance, target])

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-surface text-sm text-muted">
        {t('noTransactions')}
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">{t('cashflow')}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#2E3348" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickFormatter={(v) => formatCurrency(Number(v), true)}
              width={56}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value ?? 0)), t('balance.current')]}
              contentStyle={{
                background: '#1A1D27',
                border: '1px solid #2E3348',
                borderRadius: 12,
              }}
            />
            <Line type="monotone" dataKey="balance" stroke="#6366F1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
