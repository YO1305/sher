import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import { useDebtStore } from '../../store/debtStore'
import { useTransactionStore } from '../../store/transactionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUiStore } from '../../store/uiStore'
import { useDebts, useDebtStats } from '../../hooks/useDebts'
import { isLoanRelated } from '../../utils/debtSync'
import { sumCreditsDueThisMonth } from '../../utils/creditSchedule'
import { DebtCard } from './DebtCard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import type { DebtType } from '../../types'
import { formatCurrency } from '../../utils/formatCurrency'

export function DebtList() {
  const { t } = useTranslation()
  const debts = useDebts()
  const stats = useDebtStats()
  const transactions = useTransactionStore((s) => s.transactions)
  const banks = useSettingsStore((s) => s.banks)
  const rebuild = useDebtStore((s) => s.rebuildFromTransactions)
  const addDebt = useDebtStore((s) => s.addDebt)
  const updateDebt = useDebtStore((s) => s.updateDebt)
  const open = useUiStore((s) => s.debtModalOpen)
  const editingId = useUiStore((s) => s.editingDebtId)
  const openAdd = useUiStore((s) => s.openAddDebt)
  const close = useUiStore((s) => s.closeDebtModal)

  useEffect(() => {
    rebuild()
  }, [rebuild, transactions])

  const loanTxs = useMemo(
    () => transactions.filter((tx) => isLoanRelated(tx)),
    [transactions],
  )
  const loanWithoutContact = useMemo(
    () => loanTxs.filter((tx) => !tx.counterparty?.trim()).length,
    [loanTxs],
  )

  const creditsDue = useMemo(
    () =>
      sumCreditsDueThisMonth(
        debts.filter((d) => d.type === 'credit'),
        transactions,
      ),
    [debts, transactions],
  )

  const editing = debts.find((d) => d.id === editingId)

  const [type, setType] = useState<DebtType>('lend')
  const [name, setName] = useState('')
  const [bankId, setBankId] = useState('')
  const [contractNumber, setContractNumber] = useState('')
  const [monthsTotal, setMonthsTotal] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [remainingAmount, setRemainingAmount] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType(editing?.type ?? 'lend')
    setName(editing?.name ?? '')
    setBankId(editing?.bankId ?? '')
    setContractNumber(editing?.contractNumber ?? '')
    setMonthsTotal(editing?.monthsTotal != null ? String(editing.monthsTotal) : '')
    setTotalAmount(editing ? String(editing.totalAmount) : '')
    setRemainingAmount(editing ? String(editing.remainingAmount) : '')
    setMonthlyPayment(editing?.monthlyPayment != null ? String(editing.monthlyPayment) : '')
    setStartDate(editing?.startDate ?? dayjs().format('YYYY-MM-DD'))
    setNote(editing?.note ?? '')
    setError('')
  }, [open, editing])

  // Auto-calc total from months × monthly for new credits
  useEffect(() => {
    if (type !== 'credit' || editing) return
    const months = Number(monthsTotal) || 0
    const monthly = Number(monthlyPayment) || 0
    if (months > 0 && monthly > 0) {
      setTotalAmount(String(months * monthly))
      setRemainingAmount(String(months * monthly))
    }
  }, [type, monthsTotal, monthlyPayment, editing])

  const sections = useMemo(
    () => [
      {
        key: 'credit' as const,
        title: t('creditsBanksCards'),
        total: stats.credit,
        count: stats.creditCount,
        items: debts.filter(
          (d) =>
            (d.type === 'credit' || d.type === 'card') &&
            !d.isPaid &&
            d.remainingAmount > 0,
        ),
      },
      {
        key: 'lend' as const,
        title: t('lend'),
        total: stats.lend,
        count: stats.lendCount,
        items: debts.filter(
          (d) => d.type === 'lend' && !d.isPaid && d.remainingAmount > 0,
        ),
      },
      {
        key: 'owe' as const,
        title: t('owe'),
        total: stats.owe,
        count: stats.oweCount,
        items: debts.filter(
          (d) => d.type === 'owe' && !d.isPaid && d.remainingAmount > 0,
        ),
      },
    ],
    [debts, stats, t],
  )

  const handleSave = () => {
    const bank = banks.find((b) => b.id === bankId)
    const displayName =
      type === 'credit'
        ? name.trim() || bank?.name || ''
        : name.trim()

    if (!displayName) {
      setError(t('validation.name'))
      return
    }

    const months = type === 'credit' ? Math.round(Number(monthsTotal) || 0) : 0
    const monthly =
      type === 'credit' ? Math.round(Number(monthlyPayment) || 0) : 0

    let total = Math.round(Number(totalAmount) || 0)
    if (type === 'credit' && months > 0 && monthly > 0 && !total) {
      total = months * monthly
    }
    if (total <= 0) {
      setError(t('validation.amount'))
      return
    }
    if (type === 'credit' && (!monthly || monthly <= 0)) {
      setError(t('validation.monthlyPayment'))
      return
    }
    if (type === 'credit' && (!months || months <= 0)) {
      setError(t('validation.months'))
      return
    }

    const remaining = remainingAmount
      ? Math.round(Number(remainingAmount) || 0)
      : total

    const payload = {
      type,
      name: displayName,
      totalAmount: total,
      remainingAmount: remaining,
      monthlyPayment: type === 'credit' ? monthly : undefined,
      monthsTotal: type === 'credit' ? months : undefined,
      bankId: type === 'credit' ? bankId || undefined : undefined,
      contractNumber:
        type === 'credit' ? contractNumber.trim() || undefined : undefined,
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted md:text-xs">
            {t('creditsBanksCards')}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-amber-400 md:text-base">
            {formatCurrency(stats.credit, true)}
          </p>
          <p className="text-[10px] text-muted">
            {t('dueThisMonth')}: {formatCurrency(creditsDue, true)}
          </p>
        </div>
        <div className="rounded-xl bg-income/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted md:text-xs">
            {t('lend')}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-income md:text-base">
            {formatCurrency(stats.lend, true)}
          </p>
          <p className="text-[10px] text-muted">{stats.lendCount}</p>
        </div>
        <div className="rounded-xl bg-expense/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted md:text-xs">
            {t('owe')}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-expense md:text-base">
            {formatCurrency(stats.owe, true)}
          </p>
          <p className="text-[10px] text-muted">{stats.oweCount}</p>
        </div>
      </div>

      <p className="text-xs text-muted">{t('debts.autoHint')}</p>

      {loanWithoutContact > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {t('debts.missingContact', { count: loanWithoutContact })}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus size={16} />
          {t('addDebt')}
        </Button>
      </div>

      {sections.map((section) => (
        <section key={section.key}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {section.title}
            </h2>
            {section.total > 0 && (
              <span className="font-mono text-sm font-semibold text-gold">
                {formatCurrency(section.total)}
              </span>
            )}
          </div>
          {section.items.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted">
              {t('noDebts')}
              {section.key === 'lend' && (
                <span className="mt-1 block text-xs">{t('debts.howToLend')}</span>
              )}
              {section.key === 'credit' && (
                <span className="mt-1 block text-xs">{t('debts.howToCredit')}</span>
              )}
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
              { value: 'lend', label: t('lend') },
              { value: 'owe', label: t('owe') },
              { value: 'credit', label: t('credits') },
            ]}
          />

          {type === 'credit' ? (
            <>
              <Select
                label={t('settings.banks')}
                value={bankId}
                onChange={(e) => {
                  setBankId(e.target.value)
                  const b = banks.find((x) => x.id === e.target.value)
                  if (b && !name.trim()) setName(b.name)
                }}
                options={[
                  { value: '', label: `— ${t('settings.bankOptional')} —` },
                  ...banks.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
              <Input
                label={t('creditName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('creditNameHint')}
              />
              <Input
                label={t('contractNumber')}
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder={t('optional')}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t('monthsTotal')}
                  inputMode="numeric"
                  value={monthsTotal}
                  onChange={(e) => setMonthsTotal(e.target.value.replace(/[^\d]/g, ''))}
                />
                <Input
                  label={t('monthlyPayment')}
                  inputMode="numeric"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>
            </>
          ) : (
            <Input label={t('bankName')} value={name} onChange={(e) => setName(e.target.value)} />
          )}

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
