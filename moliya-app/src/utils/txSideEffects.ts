import type { Transaction } from '../types'

type NewTransaction = Omit<Transaction, 'id' | 'createdAt'> & { id?: string }

export function applySideEffects(tx: Transaction, mode: 'apply' | 'revert') {
  const sign = mode === 'apply' ? 1 : -1

  // Savings transfers
  if (tx.transferKind === 'to_savings' || tx.category === 'savings_deposit') {
    void import('../store/settingsStore').then(({ useSettingsStore }) => {
      useSettingsStore.getState().adjustSavings(sign * tx.amount)
    })
  }
  if (tx.transferKind === 'from_savings' || tx.category === 'savings_withdraw') {
    void import('../store/settingsStore').then(({ useSettingsStore }) => {
      useSettingsStore.getState().adjustSavings(-sign * tx.amount)
    })
  }

  // Credit installment payments
  if (tx.category === 'credit_pay' && tx.type === 'expense' && tx.creditId) {
    void import('../store/debtStore').then(({ useDebtStore }) => {
      useDebtStore.getState().applyCreditPayment(tx.creditId!, tx.amount, mode)
    })
  }
}

export function notifyDebtsChanged() {
  queueMicrotask(() => {
    void import('../store/debtStore').then(({ useDebtStore, ensureDebtTxSync }) => {
      ensureDebtTxSync()
      useDebtStore.getState().rebuildFromTransactions()
    })
  })
}

export type { NewTransaction }
