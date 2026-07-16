import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { useUiStore } from '../../store/uiStore'
import { useTransactionStore } from '../../store/transactionStore'
import { getCategoriesByType } from '../../utils/categories'

export function AddTransactionModal() {
  const { t } = useTranslation()
  const open = useUiStore((s) => s.transactionModalOpen)
  const editing = useUiStore((s) => s.editingTransaction)
  const close = useUiStore((s) => s.closeTransactionModal)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [counterparty, setCounterparty] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({})

  useEffect(() => {
    if (!open) return
    setType(editing?.type ?? 'expense')
    setAmount(editing ? String(editing.amount) : '')
    setCategory(editing?.category ?? '')
    setDate(editing?.date ?? dayjs().format('YYYY-MM-DD'))
    setCounterparty(editing?.counterparty ?? '')
    setDescription(editing?.description ?? '')
    setErrors({})
  }, [open, editing])

  const categories = getCategoriesByType(type)
  const categoryOptions = [
    { value: '', label: `— ${t('category')} —` },
    ...categories.map((c) => ({ value: c.key, label: t(`category.${c.key}`) })),
  ]

  const handleTypeChange = (next: 'income' | 'expense') => {
    setType(next)
    setCategory('')
  }

  const handleSave = () => {
    const nextErrors: typeof errors = {}
    const num = Number(amount.replace(/\s/g, ''))
    if (!amount || !Number.isFinite(num) || num <= 0) nextErrors.amount = t('validation.amount')
    if (!category) nextErrors.category = t('validation.category')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const payload = {
      type,
      amount: Math.round(num),
      category,
      date,
      counterparty: counterparty.trim() || undefined,
      description: description.trim() || undefined,
    }

    if (editing) {
      updateTransaction(editing.id, payload)
    } else {
      addTransaction(payload)
    }
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? t('editTransaction') : t('addTransaction')}
      accent={type}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            className="flex-1"
            variant={type === 'income' ? 'income' : 'expense'}
            onClick={handleSave}
          >
            {t('save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface2 p-1">
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
              type === 'income' ? 'bg-income text-white' : 'text-muted'
            }`}
          >
            {t('income')}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors ${
              type === 'expense' ? 'bg-expense text-white' : 'text-muted'
            }`}
          >
            {t('expense')}
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">{t('amount')}</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="0"
            className={`w-full rounded-xl border border-border bg-surface2 px-3 py-3 text-center font-mono text-3xl font-bold outline-none focus:border-primary ${
              type === 'income' ? 'text-income' : 'text-expense'
            }`}
          />
          {errors.amount && <p className="mt-1 text-xs text-expense">{errors.amount}</p>}
        </div>

        <Select
          label={t('category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categoryOptions}
          error={errors.category}
        />

        <Input
          label={t('date')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          label={t('counterparty')}
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
          placeholder={t('optional')}
        />

        <Input
          label={t('description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('optional')}
        />
      </div>
    </Modal>
  )
}
