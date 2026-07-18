import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Debt, Transaction } from '../types'
import { applyTxToDebts } from '../utils/debtSync'

interface DebtState {
  debts: Debt[]
  addDebt: (debt: Omit<Debt, 'id'>) => void
  updateDebt: (id: string, patch: Partial<Debt>) => void
  deleteDebt: (id: string) => void
  markPaid: (id: string) => void
  setDebts: (debts: Debt[]) => void
  clearDebts: () => void
  applyTransactionEffect: (tx: Transaction, mode: 'apply' | 'revert') => void
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set) => ({
      debts: [],
      addDebt: (debt) =>
        set((state) => ({
          debts: [...state.debts, { ...debt, id: crypto.randomUUID() }],
        })),
      updateDebt: (id, patch) =>
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      deleteDebt: (id) =>
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        })),
      markPaid: (id) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, isPaid: true, remainingAmount: 0 } : d,
          ),
        })),
      setDebts: (debts) => set({ debts }),
      clearDebts: () => set({ debts: [] }),
      applyTransactionEffect: (tx, mode) =>
        set((state) => ({
          debts: applyTxToDebts(state.debts, tx, mode),
        })),
    }),
    { name: 'moliya_debts' },
  ),
)
