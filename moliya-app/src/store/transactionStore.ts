import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '../types'

interface TransactionState {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  setTransactions: (txs: Transaction[]) => void
  clearTransactions: () => void
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...tx,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      setTransactions: (txs) => set({ transactions: txs }),
      clearTransactions: () => set({ transactions: [] }),
    }),
    { name: 'moliya_transactions' },
  ),
)
