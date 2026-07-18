import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useEnvelopeStore } from '../../store/envelopeStore'
import { getCategoryLabel } from '../../utils/categoryHelpers'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  open: boolean
  onClose: () => void
  fromKey: string
  month: string
  categoryKeys: string[]
  maxAmount: number
}

export function MoveMoneyModal({
  open,
  onClose,
  fromKey,
  month,
  categoryKeys,
  maxAmount,
}: Props) {
  const { t } = useTranslation()
  const moveMoney = useEnvelopeStore((s) => s.moveMoney)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)
  const [toKey, setToKey] = useState('')
  const [amount, setAmount] = useState('')

  const fromLabel = getCategoryLabel(fromKey, t, overrides, custom)
  const options = useMemo(
    () => [
      { value: '', label: `— ${t('budget.selectEnvelope')} —` },
      ...categoryKeys
        .filter((k) => k !== fromKey)
        .map((k) => ({
          value: k,
          label: getCategoryLabel(k, t, overrides, custom),
        })),
    ],
    [categoryKeys, fromKey, t, overrides, custom],
  )

  const handleSave = () => {
    const n = Math.round(Number(amount.replace(/\s/g, '')))
    if (!toKey || !Number.isFinite(n) || n <= 0) return
    moveMoney(fromKey, toKey, month, Math.min(n, Math.max(0, maxAmount)))
    setAmount('')
    setToKey('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('move_money')}>
      <p className="mb-3 text-sm text-muted">
        {t('budget.from')}: {fromLabel}
      </p>
      <Select
        label={t('budget.to')}
        value={toKey}
        onChange={(e) => setToKey(e.target.value)}
        options={options}
      />
      <Input
        label={t('amount')}
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
        className="mt-3"
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
