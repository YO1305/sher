import type { Account, BudgetSettings, Envelope, EnvelopeStatus } from './types'
import type { Transaction } from '../types'

export function currentBudgetMonth(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Activity for a category in a month (expenses negative, income positive). */
export function computeCategoryActivity(
  categoryKey: string,
  month: string,
  transactions: Transaction[],
): number {
  return transactions
    .filter(
      (t) =>
        t.category === categoryKey &&
        t.date.startsWith(month) &&
        !(t as { isPending?: boolean }).isPending &&
        !t.isCardLoan,
    )
    .reduce((sum, t) => {
      if (t.type === 'expense') return sum - t.amount
      if (t.type === 'income') return sum + t.amount
      return sum
    }, 0)
}

export function computeEnvelope(
  envelope: Envelope,
  transactions: Transaction[],
  prevEnvelope: Envelope | undefined,
  settings: Pick<BudgetSettings, 'rolloverStrategy'>,
): Envelope {
  const activity = computeCategoryActivity(
    envelope.categoryKey,
    envelope.month,
    transactions,
  )
  const rolledOver =
    settings.rolloverStrategy === 'rollover' && prevEnvelope
      ? Math.max(0, prevEnvelope.available)
      : 0
  const available = envelope.assigned + rolledOver + activity
  return { ...envelope, activity, rolledOver, available }
}

export function computeReadyToAssign(
  accounts: Account[],
  envelopes: Envelope[],
  month: string,
  hiddenAccountIds: string[] = [],
): number {
  const totalCash = accounts
    .filter(
      (a) =>
        a.isActive &&
        a.type !== 'credit' &&
        a.type !== 'debt' &&
        !hiddenAccountIds.includes(a.id),
    )
    .reduce((sum, a) => sum + a.balance, 0)

  const totalAssigned = envelopes
    .filter((e) => e.month >= month)
    .reduce((sum, e) => sum + e.assigned, 0)

  return totalCash - totalAssigned
}

export function envelopeStatus(env: Envelope): EnvelopeStatus {
  if (env.goalType && env.goalAmount != null) {
    if (env.available >= env.goalAmount) return 'funded'
    if (env.goalDate && env.goalDate < new Date().toISOString().slice(0, 10)) {
      return 'unfunded'
    }
  }
  if (env.available < 0) return 'red'
  if (env.available === 0 && (env.assigned > 0 || env.activity !== 0)) return 'yellow'
  if (env.assigned === 0 && env.activity === 0 && env.rolledOver === 0) return 'empty'
  return 'green'
}

export function statusColor(status: EnvelopeStatus): string {
  switch (status) {
    case 'green':
    case 'funded':
      return '#3FB950'
    case 'yellow':
      return '#D29922'
    case 'red':
    case 'unfunded':
      return '#F85149'
    default:
      return '#484F58'
  }
}

/** Recompute all envelopes for a month from stored assigned + txs. */
export function recomputeMonthEnvelopes(
  stored: Envelope[],
  month: string,
  transactions: Transaction[],
  allEnvelopes: Envelope[],
  settings: Pick<BudgetSettings, 'rolloverStrategy'>,
): Envelope[] {
  const prev = prevMonth(month)
  return stored
    .filter((e) => e.month === month)
    .map((e) => {
      const prevEnv = allEnvelopes.find(
        (p) => p.categoryKey === e.categoryKey && p.month === prev,
      )
      const withPrev = prevEnv
        ? computeEnvelope(prevEnv, transactions, undefined, settings)
        : undefined
      return computeEnvelope(e, transactions, withPrev, settings)
    })
}
