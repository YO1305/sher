import { create } from 'zustand'
import type { Transaction } from '../types'

interface UiState {
  transactionModalOpen: boolean
  editingTransaction: Transaction | null
  debtModalOpen: boolean
  editingDebtId: string | null
  openAddTransaction: () => void
  openEditTransaction: (tx: Transaction) => void
  closeTransactionModal: () => void
  openAddDebt: () => void
  openEditDebt: (id: string) => void
  closeDebtModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  transactionModalOpen: false,
  editingTransaction: null,
  debtModalOpen: false,
  editingDebtId: null,
  openAddTransaction: () => set({ transactionModalOpen: true, editingTransaction: null }),
  openEditTransaction: (tx) => set({ transactionModalOpen: true, editingTransaction: tx }),
  closeTransactionModal: () => set({ transactionModalOpen: false, editingTransaction: null }),
  openAddDebt: () => set({ debtModalOpen: true, editingDebtId: null }),
  openEditDebt: (id) => set({ debtModalOpen: true, editingDebtId: id }),
  closeDebtModal: () => set({ debtModalOpen: false, editingDebtId: null }),
}))
