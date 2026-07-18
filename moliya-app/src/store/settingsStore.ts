import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CategoryOverride, CustomCategory, Settings } from '../types'
import { DEFAULT_CREDIT_CARDS } from '../types'
import i18n from '../i18n'

interface SettingsState extends Settings {
  setUserName: (name: string) => void
  setLanguage: (lang: 'uz' | 'ru') => void
  setInitialBalance: (amount: number) => void
  setOnboardingDone: (done: boolean) => void
  setSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
  // Credit cards
  addCreditCard: (name: string) => void
  updateCreditCard: (id: string, name: string) => void
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
  creditCards: DEFAULT_CREDIT_CARDS,
  customCategories: [],
  categoryOverrides: [],
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
      addCreditCard: (name) =>
        set((state) => ({
          creditCards: [
            ...state.creditCards,
            { id: crypto.randomUUID(), name: name.trim() },
          ],
        })),
      updateCreditCard: (id, name) =>
        set((state) => ({
          creditCards: state.creditCards.map((c) =>
            c.id === id ? { ...c, name: name.trim() } : c,
          ),
        })),
      deleteCreditCard: (id) =>
        set((state) => ({
          creditCards: state.creditCards.filter((c) => c.id !== id),
        })),
      addCustomCategory: (cat) =>
        set((state) => {
          const key =
            cat.key ??
            `custom_${cat.type}_${Date.now().toString(36)}`
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
        return {
          ...current,
          ...p,
          creditCards:
            p.creditCards && p.creditCards.length > 0
              ? p.creditCards
              : DEFAULT_CREDIT_CARDS,
          customCategories: p.customCategories ?? [],
          categoryOverrides: p.categoryOverrides ?? [],
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state?.language) void i18n.changeLanguage(state.language)
        if (state && (!state.creditCards || state.creditCards.length === 0)) {
          state.creditCards = DEFAULT_CREDIT_CARDS
        }
        if (state && !state.customCategories) state.customCategories = []
        if (state && !state.categoryOverrides) state.categoryOverrides = []
      },
    },
  ),
)
