import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '../types'
import { applySideEffects, notifyDebtsChanged, type NewTransaction } from '../utils/txSideEffects'

interface TransactionState {
  transactions: Transaction[]
  addTransaction: (tx: NewTransaction) => Transaction
  addTransactions: (txs: NewTransaction[]) => Transaction[]
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  setTransactions: (txs: Transaction[]) => void
  clearTransactions: () => void
}

function withIds(tx: NewTransaction): Transaction {
  const { id: presetId, ...rest } = tx
  return {
    ...rest,
    id: presetId ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (tx) => {
        const full = withIds(tx)
        set((state) => ({
          transactions: [...state.transactions, full],
        }))
        applySideEffects(full, 'apply')
        notifyDebtsChanged()
        return full
      },
      addTransactions: (txs) => {
        const created = txs.map((tx) => withIds(tx))
        set((state) => ({
          transactions: [...state.transactions, ...created],
        }))
        for (const full of created) applySideEffects(full, 'apply')
        notifyDebtsChanged()
        return created
      },
      updateTransaction: (id, patch) => {
        const prev = get().transactions.find((t) => t.id === id)
        if (!prev) return
        applySideEffects(prev, 'revert')
        const next = { ...prev, ...patch }
        let list = get().transactions.map((t) => (t.id === id ? next : t))

        if (prev.linkedTxId && (patch.amount != null || patch.date != null)) {
          const linked = list.find((t) => t.id === prev.linkedTxId)
          if (linked) {
            applySideEffects(linked, 'revert')
            const linkedNext = {
              ...linked,
              ...(patch.amount != null ? { amount: patch.amount } : {}),
              ...(patch.date != null ? { date: patch.date } : {}),
            }
            list = list.map((t) => (t.id === linked.id ? linkedNext : t))
            applySideEffects(linkedNext, 'apply')
          }
        }
        set({ transactions: list })
        applySideEffects(next, 'apply')
        notifyDebtsChanged()
      },
      deleteTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id)
        if (!tx) return
        const linkedId = tx.linkedTxId
        const linked = linkedId
          ? get().transactions.find((t) => t.id === linkedId)
          : undefined
        applySideEffects(tx, 'revert')
        if (linked) applySideEffects(linked, 'revert')
        set((state) => ({
          transactions: state.transactions.filter(
            (t) => t.id !== id && t.id !== linkedId,
          ),
        }))
        notifyDebtsChanged()
      },
      setTransactions: (txs) => {
        set({ transactions: txs })
        notifyDebtsChanged()
      },
      clearTransactions: () => {
        set({ transactions: [] })
        notifyDebtsChanged()
      },
    }),
    {
      name: 'moliya_transactions',
      onRehydrateStorage: () => () => {
        notifyDebtsChanged()
      },
    },
  ),
)
