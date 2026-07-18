import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import type { Debt } from '../../types'
import { useTransactionStore } from '../../store/transactionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { formatCreditLabel, getCreditPaySuggestion } from '../../utils/creditSchedule'
import { estimateOnTimeFee, estimateLateInterest } from '../../utils/cardDebt'
import { formatCurrency } from '../../utils/formatCurrency'
import { getCashBalance } from '../../utils/cashBalance'

interface Props {
  debt: Debt | null
  open: boolean
  onClose: () => void
}

type PayMode = 'monthly' | 'custom' | 'full'

export function PayCreditModal({ debt, open, onClose }: Props) {
  const { t } = useTranslation()
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const transactions = useTransactionStore((s) => s.transactions)
  const banks = useSettingsStore((s) => s.banks)
  const creditCards = useSettingsStore((s) => s.creditCards)
  const [mode, setMode] = useState<PayMode>('monthly')
  const [customAmount, setCustomAmount] = useState('')
  const [error, setError] = useState('')

  const isCard = debt?.type === 'card'
  const card = creditCards.find((c) => c.id === debt?.cardId)

  const monthly = debt?.monthlyPayment ?? 0
  const remaining = debt?.remainingAmount ?? 0
  const balance = getCashBalance()
  const suggestedPay =
    debt && debt.type === 'credit'
      ? getCreditPaySuggestion(debt, transactions)
      : remaining


  const pastDue =
    isCard && debt?.dueDate ? dayjs().isAfter(dayjs(debt.dueDate), 'day') : false
  const fee = card && !pastDue ? estimateOnTimeFee(card, remaining) : 0
  const lateEst = card && pastDue ? estimateLateInterest(card, remaining) : 0

  useEffect(() => {
    if (!open || !debt) return
    setMode(isCard ? 'full' : 'monthly')
    const defaultAmt = isCard
      ? remaining
      : Math.min(suggestedPay || monthly || remaining, remaining)
    setCustomAmount(String(defaultAmt))
    setError('')
  }, [open, debt, monthly, remaining, isCard, suggestedPay])

  if (!debt) return null

  const bankName = banks.find((b) => b.id === debt.bankId)?.name
  const label = isCard ? debt.name : formatCreditLabel(debt, bankName)

  const resolveAmount = (): number => {
    if (mode === 'monthly') {
      if (isCard) return remaining
      return Math.min(suggestedPay > 0 ? suggestedPay : monthly || remaining, remaining)
    }
    if (mode === 'full') return remaining
    return Math.round(Number(customAmount) || 0)
  }

  const handlePay = () => {
    const amount = resolveAmount()
    if (amount <= 0) {
      setError(t('validation.amount'))
      return
    }
    if (amount > remaining) {
      setError(t('payCredit.tooMuch'))
      return
    }
    const totalCash = amount + (mode === 'full' || amount >= remaining ? fee : 0)
    if (balance < totalCash) {
      setError(t('payCredit.insufficientBalance', { balance: formatCurrency(balance) }))
      return
    }

    addTransaction({
      type: 'expense',
      category: isCard ? 'card_pay' : 'credit_pay',
      amount,
      date: dayjs().format('YYYY-MM-DD'),
      counterparty: label,
      creditId: isCard ? undefined : debt.id,
      cardId: isCard ? debt.cardId : undefined,
      description:
        mode === 'full'
          ? t('payCredit.fullClose')
          : mode === 'monthly'
            ? t('payCredit.monthlyPay')
            : t('payCredit.customPay'),
      paymentMethod: 'cash',
    })

    if (fee > 0 && (mode === 'full' || amount >= remaining)) {
      addTransaction({
        type: 'expense',
        category: 'other_expense',
        amount: fee,
        date: dayjs().format('YYYY-MM-DD'),
        counterparty: label,
        cardId: debt.cardId,
        description: t('payCredit.onTimeFee'),
        paymentMethod: 'cash',
      })
    }

    onClose()
  }

  const preview = resolveAmount()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCard ? t('payCredit.cardTitle') : t('payCredit.title')}
      accent="expense"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button className="flex-1" variant="expense" onClick={handlePay}>
            {t('payCredit.confirm')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-surface2 px-3 py-3">
          <p className="font-semibold">{label}</p>
          <p className="mt-1 text-sm text-muted">
            {t('remaining')}:{' '}
            <span className="font-mono text-gold">{formatCurrency(remaining)}</span>
          </p>
          {debt.dueDate && (
            <p className="text-sm text-muted">
              {t('dueDate')}: {dayjs(debt.dueDate).format('DD.MM.YYYY')}
              {pastDue && (
                <span className="ml-1 text-expense">({t('overdue')})</span>
              )}
            </p>
          )}
          {lateEst > 0 && (
            <p className="text-xs text-expense">
              {t('payCredit.lateInterestEst')}: ~{formatCurrency(lateEst)}
            </p>
          )}
          <p className="text-sm text-muted">
            {t('balance.current')}:{' '}
            <span className={`font-mono ${balance <= 0 ? 'text-expense' : 'text-income'}`}>
              {formatCurrency(balance)}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          {(
            [
              !isCard
                ? {
                    key: 'monthly' as const,
                    label: t('payCredit.monthly'),
                    hint:
                      monthly > 0
                        ? formatCurrency(Math.min(monthly, remaining))
                        : formatCurrency(remaining),
                  }
                : null,
              {
                key: 'custom' as const,
                label: t('payCredit.custom'),
                hint: t('payCredit.customHint'),
              },
              {
                key: 'full' as const,
                label: t('payCredit.full'),
                hint: formatCurrency(remaining),
              },
            ] as const
          )
            .filter(Boolean)
            .map((opt) => (
              <button
                key={opt!.key}
                type="button"
                onClick={() => setMode(opt!.key)}
                className={`flex min-h-[52px] w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors ${
                  mode === opt!.key
                    ? 'border-primary bg-primary/15'
                    : 'border-border bg-surface2'
                }`}
              >
                <span className="text-sm font-semibold">{opt!.label}</span>
                <span className="text-xs text-muted">{opt!.hint}</span>
              </button>
            ))}
        </div>

        {mode === 'custom' && (
          <Input
            label={t('amount')}
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ''))}
          />
        )}

        {fee > 0 && (
          <p className="text-xs text-muted">
            {t('payCredit.onTimeFeeHint', { fee: formatCurrency(fee) })}
          </p>
        )}

        {preview > 0 && (
          <p className="text-center font-mono text-lg font-bold text-expense">
            −{formatCurrency(preview + (mode === 'full' ? fee : 0))}
          </p>
        )}

        {error && <p className="text-xs text-expense">{error}</p>}
      </div>
    </Modal>
  )
}
