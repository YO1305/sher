import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Envelope, EnvelopeGoalType } from '../core/types'
import {
  computeEnvelope,
  currentBudgetMonth,
  prevMonth,
} from '../core/budget-engine'
import type { Transaction } from '../types'
import type { RolloverStrategy } from '../core/types'

interface EnvelopeState {
  envelopes: Envelope[]
  assign: (categoryKey: string, month: string, amount: number) => void
  addAssigned: (categoryKey: string, month: string, delta: number) => void
  moveMoney: (
    fromKey: string,
    toKey: string,
    month: string,
    amount: number,
  ) => void
  setGoal: (
    categoryKey: string,
    month: string,
    goal: {
      goalType?: EnvelopeGoalType
      goalAmount?: number
      goalDate?: string
    },
  ) => void
  ensureEnvelope: (categoryKey: string, month: string) => Envelope
  getComputedForMonth: (
    month: string,
    transactions: Transaction[],
    rollover: RolloverStrategy,
  ) => Envelope[]
  clearMonth: (month: string) => void
}

function findOrCreate(
  envelopes: Envelope[],
  categoryKey: string,
  month: string,
): { list: Envelope[]; env: Envelope } {
  const existing = envelopes.find(
    (e) => e.categoryKey === categoryKey && e.month === month,
  )
  if (existing) return { list: envelopes, env: existing }
  const env: Envelope = {
    id: crypto.randomUUID(),
    categoryKey,
    month,
    assigned: 0,
    activity: 0,
    available: 0,
    rolledOver: 0,
  }
  return { list: [...envelopes, env], env }
}

export const useEnvelopeStore = create<EnvelopeState>()(
  persist(
    (set, get) => ({
      envelopes: [],

      ensureEnvelope: (categoryKey, month) => {
        const { list, env } = findOrCreate(get().envelopes, categoryKey, month)
        if (list !== get().envelopes) set({ envelopes: list })
        return env
      },

      assign: (categoryKey, month, amount) => {
        set((s) => {
          const { list, env } = findOrCreate(s.envelopes, categoryKey, month)
          return {
            envelopes: list.map((e) =>
              e.id === env.id ? { ...e, assigned: Math.round(amount) } : e,
            ),
          }
        })
      },

      addAssigned: (categoryKey, month, delta) => {
        set((s) => {
          const { list, env } = findOrCreate(s.envelopes, categoryKey, month)
          return {
            envelopes: list.map((e) =>
              e.id === env.id
                ? { ...e, assigned: Math.max(0, Math.round(e.assigned + delta)) }
                : e,
            ),
          }
        })
      },

      moveMoney: (fromKey, toKey, month, amount) => {
        const amt = Math.round(amount)
        if (amt <= 0 || fromKey === toKey) return
        set((s) => {
          let list = s.envelopes
          const from = findOrCreate(list, fromKey, month)
          list = from.list
          const to = findOrCreate(list, toKey, month)
          list = to.list
          return {
            envelopes: list.map((e) => {
              if (e.categoryKey === fromKey && e.month === month) {
                return { ...e, assigned: Math.max(0, e.assigned - amt) }
              }
              if (e.categoryKey === toKey && e.month === month) {
                return { ...e, assigned: e.assigned + amt }
              }
              return e
            }),
          }
        })
      },

      setGoal: (categoryKey, month, goal) => {
        set((s) => {
          const { list, env } = findOrCreate(s.envelopes, categoryKey, month)
          return {
            envelopes: list.map((e) => (e.id === env.id ? { ...e, ...goal } : e)),
          }
        })
      },

      getComputedForMonth: (month, transactions, rollover) => {
        const all = get().envelopes
        const monthEnvs = all.filter((e) => e.month === month)
        const settings = { rolloverStrategy: rollover }
        const prev = prevMonth(month)

        return monthEnvs.map((e) => {
          const prevRaw = all.find(
            (p) => p.categoryKey === e.categoryKey && p.month === prev,
          )
          let prevComputed: Envelope | undefined
          if (prevRaw) {
            prevComputed = computeEnvelope(prevRaw, transactions, undefined, settings)
          }
          return computeEnvelope(e, transactions, prevComputed, settings)
        })
      },

      clearMonth: (month) =>
        set((s) => ({
          envelopes: s.envelopes.filter((e) => e.month !== month),
        })),
    }),
    { name: 'moliya_v2:envelopes', version: 1 },
  ),
)

export { currentBudgetMonth }
