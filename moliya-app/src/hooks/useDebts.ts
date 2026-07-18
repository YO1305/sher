import { useMemo } from 'react'
import { useTransactionStore } from '../store/transactionStore'
import { useDebtStore } from '../store/debtStore'
import {
  buildDebtsFromTransactions,
  mergeDebts,
  summarizeDebts,
} from '../utils/debtSync'
import type { Debt } from '../types'

/** Always-fresh debts: computed from operations + manual entries. */
export function useDebts(): Debt[] {
  const transactions = useTransactionStore((s) => s.transactions) ?? []
  const manualDebts = useDebtStore((s) => s.manualDebts) ?? []

  return useMemo(() => {
    const auto = buildDebtsFromTransactions(transactions)
    return mergeDebts(
      manualDebts.map((d) => ({ ...d, source: (d.source ?? 'manual') as 'manual' })),
      auto,
    )
  }, [transactions, manualDebts])
}

export function useDebtStats() {
  const debts = useDebts()
  return useMemo(() => summarizeDebts(debts), [debts])
}
