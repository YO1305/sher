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
import { useDebts } from '../../hooks/useDebts'
import { resolveCategories } from '../../utils/categoryHelpers'
import { formatCreditLabel, getCreditDueInfo } from '../../utils/creditSchedule'
import { formatCurrency } from '../../utils/formatCurrency'

export function AddTransactionModal() {
  const { t } = useTranslation()
  const open = useUiStore((s) => s.transactionModalOpen)
  const editing = useUiStore((s) => s.editingTransaction)
  const close = useUiStore((s) => s.closeTransactionModal)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const addTransactions = useTransactionStore((s) => s.addTransactions)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)
  const creditCards = useSettingsStore((s) => s.creditCards)
  const banks = useSettingsStore((s) => s.banks)
  const customCategories = useSettingsStore((s) => s.customCategories)
  const categoryOverrides = useSettingsStore((s) => s.categoryOverrides)
  const debts = useDebts()
  const transactions = useTransactionStore((s) => s.transactions)

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [counterparty, setCounterparty] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [creditId, setCreditId] = useState('')
  const [debtId, setDebtId] = useState('')
  const [errors, setErrors] = useState<{
    amount?: string
    category?: string
    counterparty?: string
    creditId?: string
  }>({})

  const activeCredits = useMemo(
    () => debts.filter((d) => d.type === 'credit' && !d.isPaid && d.remainingAmount > 0),
    [debts],
  )
  const activeLend = useMemo(
    () => debts.filter((d) => d.type === 'lend' && !d.isPaid && d.remainingAmount > 0),
    [debts],
  )
  const activeOwe = useMemo(
    () => debts.filter((d) => d.type === 'owe' && !d.isPaid && d.remainingAmount > 0),
    [debts],
  )

  useEffect(() => {
    if (!open) return
    setType(editing?.type ?? 'expense')
    setAmount(editing ? String(editing.amount) : '')
    setCategory(editing?.category ?? '')
    setDate(editing?.date ?? dayjs().format('YYYY-MM-DD'))
    setCounterparty(editing?.counterparty ?? '')
    setDescription(editing?.description ?? '')
    setPaymentMethod(editing?.paymentMethod ?? 'cash')
    setCreditId(editing?.creditId ?? '')
    setDebtId(editing?.debtId ?? '')
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

  const creditOptions = useMemo(
    () => [
      { value: '', label: `— ${t('selectCredit')} —` },
      ...activeCredits.map((c) => {
        const bank = banks.find((b) => b.id === c.bankId)?.name
        const due = getCreditDueInfo(c, transactions)
        return {
          value: c.id,
          label: `${formatCreditLabel(c, bank)} · ${formatCurrency(due.dueThisMonth)}`,
        }
      }),
    ],
    [activeCredits, banks, transactions, t],
  )

  const isCardPayment =
    type === 'expense' &&
    paymentMethod !== 'cash' &&
    category !== 'credit_pay' &&
    category !== 'savings_deposit'
  const selectedCard = creditCards.find((c) => c.id === paymentMethod)
  const selectedCredit = activeCredits.find((c) => c.id === creditId)

  const handleTypeChange = (next: 'income' | 'expense') => {
    setType(next)
    setCategory('')
    setCreditId('')
    setDebtId('')
    if (next === 'income') setPaymentMethod('cash')
  }

  const handleCategoryChange = (key: string) => {
    setCategory(key)
    setCreditId('')
    setDebtId('')
    if (key === 'credit_pay' && activeCredits.length === 1) {
      setCreditId(activeCredits[0].id)
      const due = getCreditDueInfo(activeCredits[0], transactions)
      if (!amount) setAmount(String(due.dueThisMonth || activeCredits[0].monthlyPayment || ''))
    }
    if (key === 'savings_deposit' || key === 'savings_withdraw') {
      setPaymentMethod('cash')
    }
  }

  useEffect(() => {
    if (category === 'credit_pay' && creditId && selectedCredit && !editing) {
      const due = getCreditDueInfo(selectedCredit, transactions)
      if (due.dueThisMonth > 0) setAmount(String(due.dueThisMonth))
      setCounterparty(
        formatCreditLabel(
          selectedCredit,
          banks.find((b) => b.id === selectedCredit.bankId)?.name,
        ),
      )
    }
  }, [creditId, category]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const nextErrors: typeof errors = {}
    const num = Number(amount.replace(/\s/g, ''))
    if (!amount || !Number.isFinite(num) || num <= 0) nextErrors.amount = t('validation.amount')
    if (!category) nextErrors.category = t('validation.category')

    if (category === 'credit_pay' && !creditId) {
      nextErrors.creditId = t('validation.credit')
    }

    const loanCats = ['loan_taken', 'loan_return', 'loan_given', 'loan_pay']
    const needsCounterparty =
      loanCats.includes(category) &&
      !debtId &&
      !(type === 'expense' && paymentMethod !== 'cash' && isCardPayment)
    if (needsCounterparty && !counterparty.trim()) {
      nextErrors.counterparty = t('counterpartyRequired')
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const rounded = Math.round(num)

    // Resolve counterparty from selected personal debt
    let cp = counterparty.trim() || undefined
    let linkedDebtId = debtId || undefined
    if (debtId) {
      const d = debts.find((x) => x.id === debtId)
      if (d) {
        cp = d.name
        linkedDebtId = d.id
      }
    }
    if (category === 'credit_pay' && selectedCredit) {
      cp = formatCreditLabel(
        selectedCredit,
        banks.find((b) => b.id === selectedCredit.bankId)?.name,
      )
    }

    const transferKind =
      category === 'savings_deposit'
        ? ('to_savings' as const)
        : category === 'savings_withdraw'
          ? ('from_savings' as const)
          : undefined

    if (editing) {
      updateTransaction(editing.id, {
        type,
        amount: rounded,
        category,
        date,
        counterparty: cp,
        description: description.trim() || undefined,
        paymentMethod: type === 'expense' ? paymentMethod : 'cash',
        creditId: category === 'credit_pay' ? creditId || undefined : undefined,
        debtId: linkedDebtId,
        transferKind,
      })
      close()
      return
    }

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
          counterparty: cp || selectedCard.name,
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
      counterparty: cp,
      description: description.trim() || undefined,
      paymentMethod: type === 'expense' ? paymentMethod : 'cash',
      creditId: category === 'credit_pay' ? creditId || undefined : undefined,
      debtId: linkedDebtId,
      transferKind,
    })
    close()
  }

  const showDebtPicker =
    (category === 'loan_return' && activeLend.length > 0) ||
    (category === 'loan_pay' && activeOwe.length > 0)

  const debtPickerOptions =
    category === 'loan_return'
      ? [
          { value: '', label: `— ${t('selectDebt')} —` },
          ...activeLend.map((d) => ({
            value: d.id,
            label: `${d.name} · ${formatCurrency(d.remainingAmount)}`,
          })),
        ]
      : [
          { value: '', label: `— ${t('selectDebt')} —` },
          ...activeOwe.map((d) => ({
            value: d.id,
            label: `${d.name} · ${formatCurrency(d.remainingAmount)}`,
          })),
        ]

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
          onChange={(e) => handleCategoryChange(e.target.value)}
          options={categoryOptions}
          error={errors.category}
        />

        {category === 'credit_pay' && (
          <Select
            label={t('selectCredit')}
            value={creditId}
            onChange={(e) => setCreditId(e.target.value)}
            options={creditOptions}
            error={errors.creditId}
          />
        )}

        {showDebtPicker && (
          <Select
            label={t('selectDebt')}
            value={debtId}
            onChange={(e) => {
              setDebtId(e.target.value)
              const d = debts.find((x) => x.id === e.target.value)
              if (d) {
                setCounterparty(d.name)
                if (!amount) setAmount(String(d.remainingAmount))
              }
            }}
            options={debtPickerOptions}
          />
        )}

        {type === 'expense' &&
          category !== 'credit_pay' &&
          category !== 'savings_deposit' && (
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

        {category !== 'credit_pay' && (
          <Input
            label={t('counterparty')}
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder={
              ['loan_taken', 'loan_return', 'loan_given', 'loan_pay'].includes(category)
                ? t('counterpartyRequired')
                : t('optional')
            }
            error={errors.counterparty}
          />
        )}

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
