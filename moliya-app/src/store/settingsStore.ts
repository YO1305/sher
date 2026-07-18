import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Bank,
  CategoryOverride,
  CreditCard,
  CustomCategory,
  Settings,
} from '../types'
import { DEFAULT_BANKS, DEFAULT_CREDIT_CARDS } from '../types'
import i18n from '../i18n'

interface SettingsState extends Settings {
  setUserName: (name: string) => void
  setLanguage: (lang: 'uz' | 'ru') => void
  setInitialBalance: (amount: number) => void
  setOnboardingDone: (done: boolean) => void
  setSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
  setSavingsBalance: (amount: number) => void
  adjustSavings: (delta: number) => void
  // Banks
  addBank: (name: string) => string
  updateBank: (id: string, name: string) => void
  deleteBank: (id: string) => void
  // Credit cards
  addCreditCard: (data: Omit<CreditCard, 'id'>) => void
  updateCreditCard: (id: string, patch: Partial<Omit<CreditCard, 'id'>>) => void
  deleteCreditCard: (id: string) => void
  // Categories
  addCustomCategory: (cat: Omit<CustomCategory, 'key'> & { key?: string }) => void
  updateCustomCategory: (key: string, patch: Partial<CustomCategory>) => void
  deleteCustomCategory: (key: string) => void
  renameBuiltinCategory: (key: string, label: string) => void
  hideBuiltinCategory: (key: string) => void
  restoreBuiltinCategory: (key: string) => void
}

const defaults: Settings = {
  userName: '',
  language: 'uz',
  initialBalance: 0,
  currency: 'UZS',
  onboardingDone: false,
  banks: DEFAULT_BANKS,
  creditCards: DEFAULT_CREDIT_CARDS,
  customCategories: [],
  categoryOverrides: [],
  savingsBalance: 0,
  rolloverStrategy: 'rollover',
  budgetStartDay: 1,
  ageOfMoneyTarget: 30,
  hiddenAccountIds: [],
}

function upsertOverride(
  overrides: CategoryOverride[],
  key: string,
  patch: Partial<CategoryOverride>,
): CategoryOverride[] {
  const idx = overrides.findIndex((o) => o.key === key)
  if (idx === -1) return [...overrides, { key, ...patch }]
  return overrides.map((o, i) => (i === idx ? { ...o, ...patch } : o))
}

function migrateCards(cards: CreditCard[] | undefined, banks: Bank[]): CreditCard[] {
  if (!cards || cards.length === 0) return DEFAULT_CREDIT_CARDS
  return cards.map((c) => {
    const match = banks.find(
      (b) =>
        b.name.toLowerCase() === c.name.toLowerCase() ||
        b.id === `bank-${c.id.replace('card-', '')}`,
    )
    const defaults = DEFAULT_CREDIT_CARDS.find((d) => d.id === c.id)
    return {
      billingDay: 1,
      gracePeriodDays: 30,
      onTimeFeePercent: 0,
      lateInterestPercent: 3,
      ...defaults,
      ...c,
      bankId: c.bankId ?? match?.id,
    }
  })
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setUserName: (userName) => set({ userName }),
      setLanguage: (language) => {
        void i18n.changeLanguage(language)
        set({ language })
      },
      setInitialBalance: (initialBalance) => set({ initialBalance }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
      setSettings: (settings) => {
        if (settings.language) void i18n.changeLanguage(settings.language)
        set(settings)
      },
      resetSettings: () => {
        void i18n.changeLanguage(defaults.language)
        set({ ...defaults })
      },
      setSavingsBalance: (savingsBalance) => set({ savingsBalance: Math.max(0, Math.round(savingsBalance)) }),
      adjustSavings: (delta) =>
        set((state) => ({
          savingsBalance: Math.max(0, Math.round(state.savingsBalance + delta)),
        })),
      addBank: (name) => {
        const id = crypto.randomUUID()
        set((state) => ({
          banks: [...state.banks, { id, name: name.trim() }],
        }))
        return id
      },
      updateBank: (id, name) =>
        set((state) => ({
          banks: state.banks.map((b) => (b.id === id ? { ...b, name: name.trim() } : b)),
        })),
      deleteBank: (id) =>
        set((state) => ({
          banks: state.banks.filter((b) => b.id !== id),
          creditCards: state.creditCards.map((c) =>
            c.bankId === id ? { ...c, bankId: undefined } : c,
          ),
        })),
      addCreditCard: (data) =>
        set((state) => ({
          creditCards: [
            ...state.creditCards,
            {
              id: crypto.randomUUID(),
              name: data.name.trim(),
              bankId: data.bankId,
              limit: data.limit && data.limit > 0 ? Math.round(data.limit) : undefined,
              billingDay: data.billingDay,
              gracePeriodDays: data.gracePeriodDays,
              onTimeFeePercent: data.onTimeFeePercent,
              lateInterestPercent: data.lateInterestPercent,
            },
          ],
        })),
      updateCreditCard: (id, patch) =>
        set((state) => ({
          creditCards: state.creditCards.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...patch,
                  name: patch.name?.trim() ?? c.name,
                  limit:
                    patch.limit !== undefined
                      ? patch.limit > 0
                        ? Math.round(patch.limit)
                        : undefined
                      : c.limit,
                }
              : c,
          ),
        })),
      deleteCreditCard: (id) =>
        set((state) => ({
          creditCards: state.creditCards.filter((c) => c.id !== id),
        })),
      addCustomCategory: (cat) =>
        set((state) => {
          const key = cat.key ?? `custom_${cat.type}_${Date.now().toString(36)}`
          return {
            customCategories: [
              ...state.customCategories,
              {
                key,
                type: cat.type,
                label: cat.label.trim(),
                color: cat.color,
              },
            ],
          }
        }),
      updateCustomCategory: (key, patch) =>
        set((state) => ({
          customCategories: state.customCategories.map((c) =>
            c.key === key ? { ...c, ...patch, label: patch.label?.trim() ?? c.label } : c,
          ),
        })),
      deleteCustomCategory: (key) =>
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.key !== key),
        })),
      renameBuiltinCategory: (key, label) =>
        set((state) => ({
          categoryOverrides: upsertOverride(state.categoryOverrides, key, {
            label: label.trim(),
          }),
        })),
      hideBuiltinCategory: (key) =>
        set((state) => ({
          categoryOverrides: upsertOverride(state.categoryOverrides, key, {
            hidden: true,
          }),
        })),
      restoreBuiltinCategory: (key) =>
        set((state) => ({
          categoryOverrides: state.categoryOverrides
            .map((o) => (o.key === key ? { ...o, hidden: false } : o))
            .filter((o) => o.label || o.hidden),
        })),
    }),
    {
      name: 'moliya_settings',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Settings>
        const banks =
          p.banks && p.banks.length > 0 ? p.banks : DEFAULT_BANKS
        return {
          ...current,
          ...p,
          banks,
          creditCards: migrateCards(p.creditCards, banks),
          customCategories: p.customCategories ?? [],
          categoryOverrides: p.categoryOverrides ?? [],
          savingsBalance: p.savingsBalance ?? 0,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state?.language) void i18n.changeLanguage(state.language)
        if (state && (!state.banks || state.banks.length === 0)) {
          state.banks = DEFAULT_BANKS
        }
        if (state && (!state.creditCards || state.creditCards.length === 0)) {
          state.creditCards = DEFAULT_CREDIT_CARDS
        }
        if (state && !state.customCategories) state.customCategories = []
        if (state && !state.categoryOverrides) state.categoryOverrides = []
        if (state && state.savingsBalance == null) state.savingsBalance = 0
      },
    },
  ),
)
