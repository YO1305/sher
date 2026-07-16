import { Outlet } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { AddTransactionModal } from '../transactions/AddTransactionModal'
import { useUiStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { Onboarding } from '../Onboarding'

export function AppShell() {
  const { t } = useTranslation()
  const openAdd = useUiStore((s) => s.openAddTransaction)
  const onboardingDone = useSettingsStore((s) => s.onboardingDone)
  const userName = useSettingsStore((s) => s.userName)

  if (!onboardingDone) {
    return <Onboarding />
  }

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar />
      <div className="md:pl-16 lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur md:h-16 md:px-6">
          <div>
            <p className="text-xs text-muted md:hidden">Moliya</p>
            <h1 className="text-base font-bold tracking-tight2 md:text-lg">
              {t('welcome')}, {userName || t('guest')}
            </h1>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="hidden min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-light md:inline-flex"
          >
            <Plus size={18} />
            {t('add')}
          </button>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <button
        type="button"
        onClick={openAdd}
        aria-label={t('addTransaction')}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-light md:hidden"
      >
        <Plus size={28} />
      </button>
      <AddTransactionModal />
    </div>
  )
}
