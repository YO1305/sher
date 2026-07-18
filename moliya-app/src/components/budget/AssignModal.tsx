import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useEnvelopeStore } from '../../store/envelopeStore'
import { formatCurrency } from '../../utils/formatCurrency'
import { getCategoryLabel } from '../../utils/categoryHelpers'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  open: boolean
  onClose: () => void
  categoryKey: string
  month: string
  currentAssigned: number
  readyToAssign: number
}

export function AssignModal({
  open,
  onClose,
  categoryKey,
  month,
  currentAssigned,
  readyToAssign,
}: Props) {
  const { t } = useTranslation()
  const assign = useEnvelopeStore((s) => s.assign)
  const addAssigned = useEnvelopeStore((s) => s.addAssigned)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'set' | 'add'>('add')

  const label = getCategoryLabel(categoryKey, t, overrides, custom)

  const handleSave = () => {
    const n = Math.round(Number(amount.replace(/\s/g, '')))
    if (!Number.isFinite(n) || n < 0) return
    if (mode === 'set') assign(categoryKey, month, n)
    else addAssigned(categoryKey, month, n)
    setAmount('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('assign')}>
      <p className="mb-3 text-sm text-muted">{label}</p>
      <p className="mb-2 text-xs text-muted">
        {t('budget.nowAssigned')}: {formatCurrency(currentAssigned)} ·{' '}
        {t('ready_to_assign')}: {formatCurrency(readyToAssign)}
      </p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          className={`min-h-[40px] flex-1 rounded-lg text-sm ${mode === 'add' ? 'bg-primary/20 text-primary-light' : 'bg-surface2 text-muted'}`}
          onClick={() => setMode('add')}
        >
          {t('budget.addAmount')}
        </button>
        <button
          type="button"
          className={`min-h-[40px] flex-1 rounded-lg text-sm ${mode === 'set' ? 'bg-primary/20 text-primary-light' : 'bg-surface2 text-muted'}`}
          onClick={() => setMode('set')}
        >
          {t('budget.setAmount')}
        </button>
      </div>
      <Input
        label={t('amount')}
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
        autoFocus
      />
      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          {t('save')}
        </Button>
      </div>
    </Modal>
  )
}
