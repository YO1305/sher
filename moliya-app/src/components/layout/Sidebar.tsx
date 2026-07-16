import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeftRight, Landmark, BarChart3, Settings, Wallet } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

const items = [
  { to: '/', icon: Home, key: 'nav.dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, key: 'nav.transactions' },
  { to: '/debts', icon: Landmark, key: 'nav.debts' },
  { to: '/reports', icon: BarChart3, key: 'nav.reports' },
  { to: '/settings', icon: Settings, key: 'nav.settings' },
] as const

export function Sidebar() {
  const { t } = useTranslation()
  const userName = useSettingsStore((s) => s.userName)

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-16 flex-col border-r border-border bg-surface lg:w-60 md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-light">
          <Wallet size={22} />
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-base font-bold tracking-tight2">Moliya</p>
          <p className="truncate text-xs text-muted">{userName || t('guest')}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {items.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary-light'
                  : 'text-muted hover:bg-surface2 hover:text-slate-100'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            <span className="hidden lg:inline">{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
