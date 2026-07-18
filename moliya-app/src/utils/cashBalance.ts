import { useTransactionStore } from '../store/transactionStore'
import { useSettingsStore } from '../store/settingsStore'

/** Current cash balance from initialBalance ± all transactions. */
export function getCashBalance(): number {
  const initial = useSettingsStore.getState().initialBalance
  const txs = useTransactionStore.getState().transactions
  return txs.reduce(
    (bal, tx) => bal + (tx.type === 'income' ? tx.amount : -tx.amount),
    initial,
  )
}

/** Credit-card dual entry does not reduce cash (loan_taken + expense cancel out). */
export function isCardDualEntry(paymentMethod?: string): boolean {
  return !!paymentMethod && paymentMethod !== 'cash' && paymentMethod !== 'debit'
}
