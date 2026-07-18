import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useMonthStats } from '../../hooks/useMonthStats'
import { useSettingsStore } from '../../store/settingsStore'
import { getCategoryLabel, resolveCategory } from '../../utils/categoryHelpers'
import { formatCurrency } from '../../utils/formatCurrency'

interface Props {
  month?: string
}

export function CategoryChart({ month }: Props) {
  const { t } = useTranslation()
  const { byCategory } = useMonthStats(month)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)

  const data = useMemo(
    () =>
      Object.entries(byCategory)
        .map(([key, value]) => ({
          key,
          name: getCategoryLabel(key, t, overrides, custom),
          value,
          color: resolveCategory(key, t, overrides, custom)?.color ?? '#64748B',
        }))
        .sort((a, b) => b.value - a.value),
    [byCategory, t, overrides, custom],
  )

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-surface text-sm text-muted">
        {t('noTransactions')}
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">{t('expensesByCategory')}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                background: '#1A1D27',
                border: '1px solid #2E3348',
                borderRadius: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.slice(0, 5).map((d) => (
          <span key={d.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  )
}
