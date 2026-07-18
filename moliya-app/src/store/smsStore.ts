import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SmsLogEntry, SmsRule } from '../core/types'
import { DEFAULT_SMS_RULES } from '../core/sms-rules'
import type { Transaction } from '../types'

export interface PendingSmsTx {
  id: string
  date: string
  time?: string
  amount: number
  type: 'income' | 'expense'
  accountId?: string
  category?: string
  payee?: string
  rawSms: string
  confidence: 'high' | 'medium' | 'low'
}

interface SmsState {
  rules: SmsRule[]
  log: SmsLogEntry[]
  pending: PendingSmsTx[]
  addPending: (p: Omit<PendingSmsTx, 'id'>) => string
  confirmPending: (id: string, category: string) => PendingSmsTx | null
  dismissPending: (id: string) => void
  addLog: (entry: Omit<SmsLogEntry, 'id'>) => void
  setRules: (rules: SmsRule[]) => void
  resetRules: () => void
}

export const useSmsStore = create<SmsState>()(
  persist(
    (set, get) => ({
      rules: DEFAULT_SMS_RULES,
      log: [],
      pending: [],

      addPending: (p) => {
        const id = crypto.randomUUID()
        set((s) => ({ pending: [{ ...p, id }, ...s.pending] }))
        return id
      },

      confirmPending: (id, category) => {
        const item = get().pending.find((p) => p.id === id)
        if (!item) return null
        set((s) => ({ pending: s.pending.filter((p) => p.id !== id) }))
        return { ...item, category }
      },

      dismissPending: (id) =>
        set((s) => ({ pending: s.pending.filter((p) => p.id !== id) })),

      addLog: (entry) =>
        set((s) => ({
          log: [{ ...entry, id: crypto.randomUUID() }, ...s.log].slice(0, 100),
        })),

      setRules: (rules) => set({ rules }),
      resetRules: () => set({ rules: DEFAULT_SMS_RULES }),
    }),
    { name: 'moliya_v2:sms', version: 1 },
  ),
)

/** Build a Transaction draft from confirmed SMS pending. */
export function pendingToTransactionDraft(
  p: PendingSmsTx & { category: string },
): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    date: p.date,
    type: p.type,
    category: p.category,
    amount: p.amount,
    counterparty: p.payee,
    description: p.rawSms.slice(0, 120),
    paymentMethod: 'cash',
  }
}
