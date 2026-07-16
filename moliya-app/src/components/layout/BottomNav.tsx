import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeftRight, Landmark, BarChart3, Settings } from 'lucide-react'

const items = [
  { to: '/', icon: Home, key: 'nav.dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, key: 'nav.transactions' },
  { to: '/debts', icon: Landmark, key: 'nav.debts' },
  { to: '/reports', icon: BarChart3, key: 'nav.reports' },
] as const

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                isActive ? 'text-primary-light' : 'text-muted'
              }`
            }
          >
            <Icon size={22} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
              isActive ? 'text-primary-light' : 'text-muted'
            }`
          }
        >
          <Settings size={22} />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </div>
    </nav>
  )
}
