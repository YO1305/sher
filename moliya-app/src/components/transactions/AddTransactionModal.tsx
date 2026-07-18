import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { useUiStore } from '../../store/uiStore'
import { useTransactionStore } from '../../store/transactionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { resolveCategories } from '../../utils/categoryHelpers'

export function AddTransactionModal() {
  const { t } = useTranslation()
  const open = useUiStore((s) => s.transactionModalOpen)
  const editing = useUiStore((s) => s.editingTransaction)
  const close = useUiStore((s) => s.closeTransactionModal)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const addTransactions = useTransactionStore((s) => s.addTransactions)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)
  const creditCards = useSettingsStore((s) => s.creditCards)
  const customCategories = useSettingsStore((s) => s.customCategories)
  const categoryOverrides = useSettingsStore((s) => s.categoryOverrides)

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [counterparty, setCounterparty] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [errors, setErrors] = useState<{
    amount?: string
    category?: string
    counterparty?: string
  }>({})

  useEffect(() => {
    if (!open) return
    setType(editing?.type ?? 'expense')
    setAmount(editing ? String(editing.amount) : '')
    setCategory(editing?.category ?? '')
    setDate(editing?.date ?? dayjs().format('YYYY-MM-DD'))
    setCounterparty(editing?.counterparty ?? '')
    setDescription(editing?.description ?? '')
    setPaymentMethod(editing?.paymentMethod ?? 'cash')
    setErrors({})
  }, [open, editing])

  const categories = useMemo(
    () => resolveCategories(type, t, categoryOverrides, customCategories),
    [type, t, categoryOverrides, customCategories],
  )
  const categoryOptions = [
    { value: '', label: `— ${t('category')} —` },
    ...categories.map((c) => ({ value: c.key, label: c.label })),
  ]

  const paymentOptions = useMemo(
    () => [
      { value: 'cash', label: t('payment.cash') },
      ...creditCards.map((c) => ({ value: c.id, label: c.name })),
    ],
    [creditCards, t],
  )

  const isCardPayment = type === 'expense' && paymentMethod !== 'cash'
  const selectedCard = creditCards.find((c) => c.id === paymentMethod)

  const handleTypeChange = (next: 'income' | 'expense') => {
    setType(next)
    setCategory('')
    if (next === 'income') setPaymentMethod('cash')
  }

  const handleSave = () => {
    const nextErrors: typeof errors = {}
    const num = Number(amount.replace(/\s/g, ''))
    if (!amount || !Number.isFinite(num) || num <= 0) nextErrors.amount = t('validation.amount')
    if (!category) nextErrors.category = t('validation.category')

    const loanCats = ['loan_taken', 'loan_return', 'loan_given', 'loan_pay', 'credit_pay']
    const needsCounterparty =
      loanCats.includes(category) &&
      !(type === 'expense' && paymentMethod !== 'cash')
    if (needsCounterparty && !counterparty.trim()) {
      nextErrors.counterparty = t('counterpartyRequired')
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const rounded = Math.round(num)

    if (editing) {
      // Editing card dual-entry: keep payment method; linked pair synced in store
      updateTransaction(editing.id, {
        type,
        amount: rounded,
        category,
        date,
        counterparty: counterparty.trim() || undefined,
        description: description.trim() || undefined,
        paymentMethod: type === 'expense' ? paymentMethod : 'cash',
      })
      close()
      return
    }

    // New expense paid with credit card → dual entry:
    // 1) income loan_taken from bank  2) expense for purpose
    if (isCardPayment && selectedCard) {
      const loanId = crypto.randomUUID()
      const expenseId = crypto.randomUUID()
      const purposeNote =
        description.trim() ||
        categories.find((c) => c.key === category)?.label ||
        category

      addTransactions([
        {
          id: loanId,
          type: 'income',
          category: 'loan_taken',
          amount: rounded,
          date,
          counterparty: selectedCard.name,
          description: purposeNote,
          paymentMethod: selectedCard.id,
          linkedTxId: expenseId,
          isCardLoan: true,
        },
        {
          id: expenseId,
          type: 'expense',
          category,
          amount: rounded,
          date,
          counterparty: counterparty.trim() || selectedCard.name,
          description: description.trim() || undefined,
          paymentMethod: selectedCard.id,
          linkedTxId: loanId,
        },
      ])
      close()
      return
    }

    addTransaction({
      type,
      amount: rounded,
      category,
      date,
      counterparty: counterparty.trim() || undefined,
      description: description.trim() || undefined,
      paymentMethod: type === 'expense' ? paymentMethod : 'cash',
    })
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

        {type === 'expense' && (
          <Select
            label={t('paymentMethod')}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={paymentOptions}
          />
        )}

        {isCardPayment && selectedCard && !editing && (
          <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-gold">
            {t('payment.cardHint', { card: selectedCard.name })}
          </p>
        )}

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
          placeholder={
            ['loan_taken', 'loan_return', 'loan_given', 'loan_pay', 'credit_pay'].includes(category)
              ? t('counterpartyRequired')
              : t('optional')
          }
          error={errors.counterparty}
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
