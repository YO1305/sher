import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { useBudget } from '../hooks/useBudget'
import { ReadyToAssign } from '../components/budget/ReadyToAssign'
import { EnvelopeCard } from '../components/budget/EnvelopeCard'
import { AssignModal } from '../components/budget/AssignModal'
import { MoveMoneyModal } from '../components/budget/MoveMoneyModal'
import { currentBudgetMonth } from '../store/envelopeStore'
import { getCategoryLabel } from '../utils/categoryHelpers'
import { useSettingsStore } from '../store/settingsStore'

function shiftMonth(month: string, delta: number): string {
  return dayjs(`${month}-01`).add(delta, 'month').format('YYYY-MM')
}

export function Budget() {
  const { t } = useTranslation()
  const [month, setMonth] = useState(currentBudgetMonth())
  const { readyToAssign, envelopes, expenseKeys, ageOfMoney, ageTarget } =
    useBudget(month)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)

  const [assignKey, setAssignKey] = useState<string | null>(null)
  const [moveKey, setMoveKey] = useState<string | null>(null)

  const assignEnv = envelopes.find((e) => e.categoryKey === assignKey)
  const moveEnv = envelopes.find((e) => e.categoryKey === moveKey)

  const groups = useMemo(() => {
    const living = ['rent', 'home', 'food', 'utilities', 'comms']
    const life = ['transport', 'health', 'clothes', 'education', 'family_gift', 'charity']
    const debt = ['loan_given', 'loan_pay', 'credit_pay', 'card_pay']
    const other = expenseKeys.filter(
      (k) => !living.includes(k) && !life.includes(k) && !debt.includes(k),
    )
    const pick = (keys: string[]) =>
      envelopes.filter((e) => keys.includes(e.categoryKey))
    return [
      { title: t('budget.groupLiving'), items: pick(living) },
      { title: t('budget.groupLife'), items: pick(life) },
      { title: t('budget.groupDebts'), items: pick(debt) },
      { title: t('budget.groupOther'), items: pick(other) },
    ].filter((g) => g.items.length > 0)
  }, [envelopes, expenseKeys, t])

  const agePct = Math.min(100, Math.round((ageOfMoney / ageTarget) * 100))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight2">{t('nav.budget')}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface2"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[7rem] text-center text-sm font-medium">
            {dayjs(`${month}-01`).format('MMM YYYY')}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface2"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <ReadyToAssign amount={readyToAssign} compact />

      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="text-xs text-muted">{t('age_of_money')}</p>
        <p className="mt-1 font-mono text-lg font-bold">
          {t('age_of_money_days', { days: ageOfMoney })}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${agePct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted">
          {t('age_of_money_goal', { days: ageTarget })}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {g.title}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((env) => (
              <EnvelopeCard
                key={env.id}
                envelope={env}
                onAssign={() => setAssignKey(env.categoryKey)}
                onMove={() => setMoveKey(env.categoryKey)}
              />
            ))}
          </div>
        </section>
      ))}

      {assignKey && assignEnv && (
        <AssignModal
          open
          onClose={() => setAssignKey(null)}
          categoryKey={assignKey}
          month={month}
          currentAssigned={assignEnv.assigned}
          readyToAssign={readyToAssign}
        />
      )}

      {moveKey && moveEnv && (
        <MoveMoneyModal
          open
          onClose={() => setMoveKey(null)}
          fromKey={moveKey}
          month={month}
          categoryKeys={expenseKeys}
          maxAmount={Math.max(0, moveEnv.available)}
        />
      )}

      <p className="text-center text-[10px] text-muted">
        {t('budget.hint', {
          example: getCategoryLabel('food', t, overrides, custom),
        })}
      </p>
    </div>
  )
}
