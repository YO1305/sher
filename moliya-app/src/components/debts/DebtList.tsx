import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import { useDebtStore } from '../../store/debtStore'
import { useUiStore } from '../../store/uiStore'
import { DebtCard } from './DebtCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import type { DebtType } from '../../types'

export function DebtList() {
  const { t } = useTranslation()
  const debts = useDebtStore((s) => s.debts)
  const addDebt = useDebtStore((s) => s.addDebt)
  const updateDebt = useDebtStore((s) => s.updateDebt)
  const open = useUiStore((s) => s.debtModalOpen)
  const editingId = useUiStore((s) => s.editingDebtId)
  const openAdd = useUiStore((s) => s.openAddDebt)
  const close = useUiStore((s) => s.closeDebtModal)

  const editing = debts.find((d) => d.id === editingId)

  const [type, setType] = useState<DebtType>('owe')
  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [remainingAmount, setRemainingAmount] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType(editing?.type ?? 'owe')
    setName(editing?.name ?? '')
    setTotalAmount(editing ? String(editing.totalAmount) : '')
    setRemainingAmount(editing ? String(editing.remainingAmount) : '')
    setMonthlyPayment(editing?.monthlyPayment != null ? String(editing.monthlyPayment) : '')
    setStartDate(editing?.startDate ?? dayjs().format('YYYY-MM-DD'))
    setNote(editing?.note ?? '')
    setError('')
  }, [open, editing])

  const sections = useMemo(
    () => [
      { key: 'credit' as const, title: t('credits'), items: debts.filter((d) => d.type === 'credit') },
      { key: 'lend' as const, title: t('lend'), items: debts.filter((d) => d.type === 'lend') },
      { key: 'owe' as const, title: t('owe'), items: debts.filter((d) => d.type === 'owe') },
    ],
    [debts, t],
  )

  const handleSave = () => {
    if (!name.trim()) {
      setError(t('validation.name'))
      return
    }
    const total = Math.round(Number(totalAmount) || 0)
    if (total <= 0) {
      setError(t('validation.amount'))
      return
    }
    const remaining = remainingAmount
      ? Math.round(Number(remainingAmount) || 0)
      : total

    const payload = {
      type,
      name: name.trim(),
      totalAmount: total,
      remainingAmount: remaining,
      monthlyPayment: type === 'credit' && monthlyPayment ? Math.round(Number(monthlyPayment)) : undefined,
      startDate: startDate || undefined,
      note: note.trim() || undefined,
      isPaid: remaining <= 0,
    }

    if (editing) updateDebt(editing.id, payload)
    else addDebt(payload)
    close()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus size={16} />
          {t('addDebt')}
        </Button>
      </div>

      {sections.map((section) => (
        <section key={section.key}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {section.title}
          </h2>
          {section.items.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted">
              {t('noDebts')}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {section.items.map((debt) => (
                <DebtCard key={debt.id} debt={debt} />
              ))}
            </div>
          )}
        </section>
      ))}

      <Modal
        open={open}
        onClose={close}
        title={editing ? t('editDebt') : t('addDebt')}
        accent="default"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={close}>
              {t('cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Select
            label={t('type')}
            value={type}
            onChange={(e) => setType(e.target.value as DebtType)}
            options={[
              { value: 'credit', label: t('credits') },
              { value: 'lend', label: t('lend') },
              { value: 'owe', label: t('owe') },
            ]}
          />
          <Input label={t('bankName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label={t('totalAmount')}
            inputMode="numeric"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d]/g, ''))}
          />
          <Input
            label={t('remaining')}
            inputMode="numeric"
            value={remainingAmount}
            onChange={(e) => setRemainingAmount(e.target.value.replace(/[^\d]/g, ''))}
            placeholder={t('optional')}
          />
          {type === 'credit' && (
            <Input
              label={t('monthlyPayment')}
              inputMode="numeric"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value.replace(/[^\d]/g, ''))}
            />
          )}
          <Input
            label={t('date')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label={t('note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('optional')}
          />
          {error && <p className="text-xs text-expense">{error}</p>}
        </div>
      </Modal>
    </div>
  )
}
