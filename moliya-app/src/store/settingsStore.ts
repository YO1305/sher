import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'
import i18n from '../i18n'

interface SettingsState extends Settings {
  setUserName: (name: string) => void
  setLanguage: (lang: 'uz' | 'ru') => void
  setInitialBalance: (amount: number) => void
  setOnboardingDone: (done: boolean) => void
  setSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}

const defaults: Settings = {
  userName: '',
  language: 'uz',
  initialBalance: 0,
  currency: 'UZS',
  onboardingDone: false,
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
        set(defaults)
      },
    }),
    {
      name: 'moliya_settings',
      onRehydrateStorage: () => (state) => {
        if (state?.language) void i18n.changeLanguage(state.language)
      },
    },
  ),
)
