import { useTranslation } from 'react-i18next'
import type { Envelope, EnvelopeStatus } from '../../core/types'
import { formatCurrency } from '../../utils/formatCurrency'
import { getCategoryLabel } from '../../utils/categoryHelpers'
import { useSettingsStore } from '../../store/settingsStore'
import { statusColor } from '../../core/budget-engine'

interface Props {
  envelope: Envelope & { status: EnvelopeStatus }
  onAssign: () => void
  onMove: () => void
}

export function EnvelopeCard({ envelope, onAssign, onMove }: Props) {
  const { t } = useTranslation()
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)
  const label = getCategoryLabel(envelope.categoryKey, t, overrides, custom)
  const color = statusColor(envelope.status)
  const assigned = envelope.assigned + envelope.rolledOver
  const spent = Math.abs(Math.min(0, envelope.activity))
  const pct =
    assigned > 0 ? Math.min(100, Math.round((spent / assigned) * 100)) : envelope.available < 0 ? 100 : 0

  return (
    <button
      type="button"
      onClick={onAssign}
      onContextMenu={(e) => {
        e.preventDefault()
        onMove()
      }}
      className="w-full rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:bg-surface2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{label}</p>
          <p className="text-[10px] text-muted">
            {formatCurrency(spent)} / {formatCurrency(assigned || 0)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="font-mono text-sm font-bold"
            style={{ color }}
          >
            {envelope.available < 0
              ? t('overspent')
              : formatCurrency(envelope.available)}
          </p>
          {envelope.available < 0 && (
            <p className="font-mono text-xs text-expense">
              {formatCurrency(envelope.available)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted">{t('budget.longPressMove')}</p>
    </button>
  )
}
