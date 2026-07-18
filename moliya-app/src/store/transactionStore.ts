import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '../types'

type NewTransaction = Omit<Transaction, 'id' | 'createdAt'> & { id?: string }

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

function notifyDebtsChanged() {
  queueMicrotask(() => {
    void import('./debtStore').then(({ useDebtStore, ensureDebtTxSync }) => {
      ensureDebtTxSync()
      useDebtStore.getState().rebuildFromTransactions()
    })
  })
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
        notifyDebtsChanged()
        return full
      },
      addTransactions: (txs) => {
        const created = txs.map((tx) => withIds(tx))
        set((state) => ({
          transactions: [...state.transactions, ...created],
        }))
        notifyDebtsChanged()
        return created
      },
      updateTransaction: (id, patch) => {
        const prev = get().transactions.find((t) => t.id === id)
        if (!prev) return
        const next = { ...prev, ...patch }
        let list = get().transactions.map((t) => (t.id === id ? next : t))

        if (prev.linkedTxId && (patch.amount != null || patch.date != null)) {
          list = list.map((t) => {
            if (t.id !== prev.linkedTxId) return t
            return {
              ...t,
              ...(patch.amount != null ? { amount: patch.amount } : {}),
              ...(patch.date != null ? { date: patch.date } : {}),
            }
          })
        }
        set({ transactions: list })
        notifyDebtsChanged()
      },
      deleteTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id)
        if (!tx) return
        const linkedId = tx.linkedTxId
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
