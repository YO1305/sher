import { useMemo } from 'react'
import { useTransactionStore } from '../store/transactionStore'
import { useDebtStore } from '../store/debtStore'
import { useSettingsStore } from '../store/settingsStore'
import {
  buildDebtsFromTransactions,
  mergeDebts,
  summarizeDebts,
} from '../utils/debtSync'
import { buildCardDebts } from '../utils/cardDebt'
import type { Debt } from '../types'

/** Always-fresh debts: ops + card balances + manual entries. */
export function useDebts(): Debt[] {
  const transactions = useTransactionStore((s) => s.transactions) ?? []
  const manualDebts = useDebtStore((s) => s.manualDebts) ?? []
  const creditCards = useSettingsStore((s) => s.creditCards) ?? []

  return useMemo(() => {
    const auto = buildDebtsFromTransactions(transactions)
    const cards = buildCardDebts(creditCards, transactions)
    return mergeDebts(
      manualDebts.map((d) => ({ ...d, source: (d.source ?? 'manual') as 'manual' })),
      [...auto, ...cards],
    )
  }, [transactions, manualDebts, creditCards])
}

export function useDebtStats() {
  const debts = useDebts()
  return useMemo(() => summarizeDebts(debts), [debts])
}
