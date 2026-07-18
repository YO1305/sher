import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '../types'
import { useDebtStore } from './debtStore'

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

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (tx) => {
        const full = withIds(tx)
        set((state) => ({
          transactions: [...state.transactions, full],
        }))
        useDebtStore.getState().applyTransactionEffect(full, 'apply')
        return full
      },
      addTransactions: (txs) => {
        const created = txs.map((tx) => withIds(tx))
        set((state) => ({
          transactions: [...state.transactions, ...created],
        }))
        for (const full of created) {
          useDebtStore.getState().applyTransactionEffect(full, 'apply')
        }
        return created
      },
      updateTransaction: (id, patch) => {
        const prev = get().transactions.find((t) => t.id === id)
        if (!prev) return
        useDebtStore.getState().applyTransactionEffect(prev, 'revert')
        const next = { ...prev, ...patch }
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? next : t)),
        }))
        useDebtStore.getState().applyTransactionEffect(next, 'apply')

        if (prev.linkedTxId && (patch.amount != null || patch.date != null)) {
          const linked = get().transactions.find((t) => t.id === prev.linkedTxId)
          if (linked) {
            useDebtStore.getState().applyTransactionEffect(linked, 'revert')
            const linkedNext = {
              ...linked,
              ...(patch.amount != null ? { amount: patch.amount } : {}),
              ...(patch.date != null ? { date: patch.date } : {}),
            }
            set((state) => ({
              transactions: state.transactions.map((t) =>
                t.id === linked.id ? linkedNext : t,
              ),
            }))
            useDebtStore.getState().applyTransactionEffect(linkedNext, 'apply')
          }
        }
      },
      deleteTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id)
        if (!tx) return
        const linkedId = tx.linkedTxId
        const linked = linkedId
          ? get().transactions.find((t) => t.id === linkedId)
          : undefined

        useDebtStore.getState().applyTransactionEffect(tx, 'revert')
        if (linked) useDebtStore.getState().applyTransactionEffect(linked, 'revert')

        set((state) => ({
          transactions: state.transactions.filter(
            (t) => t.id !== id && t.id !== linkedId,
          ),
        }))
      },
      setTransactions: (txs) => set({ transactions: txs }),
      clearTransactions: () => set({ transactions: [] }),
    }),
    { name: 'moliya_transactions' },
  ),
)
