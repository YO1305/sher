import { useEffect, useMemo } from 'react'
import { useAccountStore } from '../store/accountStore'
import { useEnvelopeStore, currentBudgetMonth } from '../store/envelopeStore'
import { useTransactionStore } from '../store/transactionStore'
import { useSettingsStore } from '../store/settingsStore'
import { computeReadyToAssign, envelopeStatus } from '../core/budget-engine'
import { EXPENSE_CATEGORIES } from '../utils/categories'
import { computeAgeOfMoney } from '../core/age-of-money'
import { getCashBalance } from '../utils/cashBalance'
import type { Envelope } from '../core/types'

export function useBudget(month?: string) {
  const m = month ?? currentBudgetMonth()
  const accounts = useAccountStore((s) => s.accounts)
  const setBalance = useAccountStore((s) => s.setBalance)
  const envelopes = useEnvelopeStore((s) => s.envelopes)
  const getComputed = useEnvelopeStore((s) => s.getComputedForMonth)
  const ensureEnvelope = useEnvelopeStore((s) => s.ensureEnvelope)
  const transactions = useTransactionStore((s) => s.transactions)
  const rollover = useSettingsStore((s) => s.rolloverStrategy ?? 'rollover')
  const hidden = useSettingsStore((s) => s.hiddenAccountIds ?? [])
  const ageTarget = useSettingsStore((s) => s.ageOfMoneyTarget ?? 30)
  const custom = useSettingsStore((s) => s.customCategories)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const initialBalance = useSettingsStore((s) => s.initialBalance)
  const ensureAccounts = useAccountStore((s) => s.ensureDefaultAccounts)

  useEffect(() => {
    ensureAccounts(initialBalance)
  }, [ensureAccounts, initialBalance])

  // Keep default cash account in sync with legacy cash ledger
  useEffect(() => {
    const cash = accounts.find((a) => a.id === 'acc-cash')
    if (!cash) return
    const bal = Math.round(getCashBalance())
    if (cash.balance !== bal) setBalance('acc-cash', bal)
  }, [accounts, transactions, initialBalance, setBalance])

  const expenseKeys = useMemo(() => {
    const hiddenKeys = new Set(overrides.filter((o) => o.hidden).map((o) => o.key))
    const builtin = EXPENSE_CATEGORIES.map((c) => c.key).filter((k) => !hiddenKeys.has(k))
    const extra = custom.filter((c) => c.type === 'expense').map((c) => c.key)
    return [...builtin, ...extra]
  }, [custom, overrides])

  useEffect(() => {
    for (const key of expenseKeys) {
      ensureEnvelope(key, m)
    }
  }, [expenseKeys, m, ensureEnvelope])

  const computed: Envelope[] = useMemo(
    () => getComputed(m, transactions, rollover),
    [m, transactions, rollover, envelopes, getComputed],
  )

  const readyToAssign = useMemo(
    () => computeReadyToAssign(accounts, envelopes, m, hidden),
    [accounts, envelopes, m, hidden],
  )

  const withStatus = useMemo(
    () => computed.map((e) => ({ ...e, status: envelopeStatus(e) })),
    [computed],
  )

  const overspent = useMemo(
    () => withStatus.filter((e) => e.status === 'red'),
    [withStatus],
  )

  const ageOfMoney = useMemo(() => computeAgeOfMoney(transactions), [transactions])

  return {
    month: m,
    readyToAssign,
    envelopes: withStatus,
    overspent,
    ageOfMoney,
    ageTarget,
    expenseKeys,
  }
}
