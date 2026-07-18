import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Debt } from '../types'
import { buildDebtsFromTransactions, mergeDebts } from '../utils/debtSync'
import { useTransactionStore } from './transactionStore'

interface DebtState {
  manualDebts: Debt[]
  debts: Debt[]
  addDebt: (debt: Omit<Debt, 'id' | 'source'>) => string
  updateDebt: (id: string, patch: Partial<Debt>) => void
  deleteDebt: (id: string) => void
  markPaid: (id: string) => void
  applyCreditPayment: (creditId: string, amount: number, mode: 'apply' | 'revert') => void
  setDebts: (debts: Debt[]) => void
  clearDebts: () => void
  rebuildFromTransactions: () => void
}

function recompute(manualDebts: Debt[]): Debt[] {
  const txs = useTransactionStore.getState().transactions
  const auto = buildDebtsFromTransactions(txs)
  return mergeDebts(
    manualDebts.map((d) => ({ ...d, source: (d.source ?? 'manual') as 'manual' })),
    auto,
  )
}

export const useDebtStore = create<DebtState>()(
  persist(
    (set, get) => ({
      manualDebts: [],
      debts: [],
      addDebt: (debt) => {
        const id = crypto.randomUUID()
        const manual = [
          ...get().manualDebts,
          { ...debt, id, source: 'manual' as const },
        ]
        set({ manualDebts: manual, debts: recompute(manual) })
        return id
      },
      applyCreditPayment: (creditId, amount, mode) => {
        const delta = mode === 'apply' ? -amount : amount
        const manual = get().manualDebts.map((d) => {
          if (d.id !== creditId) return d
          const remainingAmount = Math.max(0, d.remainingAmount + delta)
          return {
            ...d,
            remainingAmount,
            isPaid: remainingAmount <= 0,
          }
        })
        set({ manualDebts: manual, debts: recompute(manual) })
      },
      updateDebt: (id, patch) => {
        const shown = recompute(get().manualDebts).find((d) => d.id === id)
          ?? get().debts.find((d) => d.id === id)
        if (!shown) return

        if (shown.source === 'auto' || id.startsWith('auto-')) {
          const without = get().manualDebts.filter(
            (d) =>
              !(
                d.type === shown.type &&
                d.name.toLowerCase() === shown.name.toLowerCase() &&
                (d.contractNumber ?? '') === (shown.contractNumber ?? '')
              ),
          )
          const manual = [
            ...without,
            {
              ...shown,
              ...patch,
              id: crypto.randomUUID(),
              source: 'manual' as const,
            },
          ]
          set({ manualDebts: manual, debts: recompute(manual) })
          return
        }

        const manual = get().manualDebts.map((d) =>
          d.id === id ? { ...d, ...patch } : d,
        )
        set({ manualDebts: manual, debts: recompute(manual) })
      },
      deleteDebt: (id) => {
        const shown = get().debts.find((d) => d.id === id)
        if (!shown) return
        if (shown.source === 'auto' || id.startsWith('auto-')) return
        const manual = get().manualDebts.filter((d) => d.id !== id)
        set({ manualDebts: manual, debts: recompute(manual) })
      },
      markPaid: (id) => {
        const shown = recompute(get().manualDebts).find((d) => d.id === id)
        if (!shown || shown.remainingAmount <= 0) {
          if (shown && shown.source !== 'auto') {
            const manual = get().manualDebts.map((d) =>
              d.id === id ? { ...d, isPaid: true, remainingAmount: 0 } : d,
            )
            set({ manualDebts: manual, debts: recompute(manual) })
          }
          return
        }

        // Credits use PayCreditModal — do not auto-pay full remaining here
        if (shown.type === 'credit') return

        const amount = shown.remainingAmount
        const today = new Date().toISOString().slice(0, 10)

        if (shown.type === 'lend') {
          useTransactionStore.getState().addTransaction({
            type: 'income',
            category: 'loan_return',
            amount,
            date: today,
            counterparty: shown.name,
            description: 'Qarzdorlik yopildi / Долг погашен',
          })
          return
        }

        // loan_pay reduces cash — block if insufficient
        void import('../utils/cashBalance').then(({ getCashBalance }) => {
          if (getCashBalance() < amount) {
            alert(
              `Недостаточно средств / Mablag' yetarli emas: ${getCashBalance()}`,
            )
            return
          }
          useTransactionStore.getState().addTransaction({
            type: 'expense',
            category: 'loan_pay',
            amount,
            date: today,
            counterparty: shown.name,
            description: "Qarz to'landi / Долг погашен",
          })
        })
      },
      setDebts: (debts) => {
        const manual = debts.filter(
          (d) => d.source !== 'auto' && !String(d.id).startsWith('auto-'),
        )
        set({ manualDebts: manual, debts: recompute(manual) })
      },
      clearDebts: () => set({ manualDebts: [], debts: [] }),
      rebuildFromTransactions: () => {
        set({ debts: recompute(get().manualDebts) })
      },
    }),
    {
      name: 'moliya_debts',
      partialize: (state) => ({
        manualDebts: state.manualDebts,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<{
          manualDebts: Debt[]
          debts: Debt[]
        }>
        const manual =
          p.manualDebts ??
          (p.debts ?? []).filter(
            (d) => d.source !== 'auto' && !String(d.id).startsWith('auto-'),
          )
        return {
          ...current,
          manualDebts: manual,
          debts: manual,
        }
      },
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          ensureDebtTxSync()
          useDebtStore.getState().rebuildFromTransactions()
        })
      },
    },
  ),
)

let subscribed = false
export function ensureDebtTxSync() {
  if (subscribed) return
  subscribed = true
  useTransactionStore.subscribe(() => {
    useDebtStore.getState().rebuildFromTransactions()
  })
  useDebtStore.getState().rebuildFromTransactions()
}
