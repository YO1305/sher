import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, AccountType } from '../core/types'
import { getCashBalance } from '../utils/cashBalance'

interface AccountState {
  accounts: Account[]
  seeded: boolean
  ensureDefaultAccounts: (initialBalance?: number) => void
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'currency'>) => string
  updateAccount: (id: string, patch: Partial<Omit<Account, 'id'>>) => void
  deleteAccount: (id: string) => void
  setBalance: (id: string, balance: number) => void
  adjustBalance: (id: string, delta: number) => void
  getDefaultAccountId: () => string | undefined
}

const COLORS = ['#3FB950', '#388BFD', '#D29922', '#BC8CFF', '#F85149', '#00B4D8']

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      seeded: false,

      ensureDefaultAccounts: (initialBalance) => {
        if (get().seeded && get().accounts.length > 0) return
        const cashBal =
          initialBalance != null ? Math.round(initialBalance) : Math.round(getCashBalance())
        const cash: Account = {
          id: 'acc-cash',
          name: 'Naqd / Наличные',
          type: 'cash',
          balance: cashBal,
          currency: 'UZS',
          color: COLORS[0],
          icon: 'Wallet',
          smsEnabled: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        set({ accounts: [cash], seeded: true })
      },

      addAccount: (data) => {
        const id = crypto.randomUUID()
        const account: Account = {
          ...data,
          id,
          currency: 'UZS',
          createdAt: new Date().toISOString(),
          balance: Math.round(data.balance),
        }
        set((s) => ({ accounts: [...s.accounts, account] }))
        return id
      },

      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...patch,
                  balance:
                    patch.balance != null ? Math.round(patch.balance) : a.balance,
                }
              : a,
          ),
        })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        })),

      setBalance: (id, balance) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, balance: Math.round(balance) } : a,
          ),
        })),

      adjustBalance: (id, delta) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, balance: Math.round(a.balance + delta) } : a,
          ),
        })),

      getDefaultAccountId: () => {
        const cash = get().accounts.find((a) => a.type === 'cash' && a.isActive)
        return cash?.id ?? get().accounts.find((a) => a.isActive)?.id
      },
    }),
    {
      name: 'moliya_v2:accounts',
      version: 1,
      migrate: (persisted) => {
        const p = persisted as { accounts?: Account[]; seeded?: boolean }
        return {
          accounts: p.accounts ?? [],
          seeded: p.seeded ?? (p.accounts?.length ?? 0) > 0,
        }
      },
    },
  ),
)

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; labelKey: string }[] = [
  { value: 'cash', labelKey: 'accounts.typeCash' },
  { value: 'card', labelKey: 'accounts.typeCard' },
  { value: 'wallet', labelKey: 'accounts.typeWallet' },
  { value: 'credit', labelKey: 'accounts.typeCredit' },
]
