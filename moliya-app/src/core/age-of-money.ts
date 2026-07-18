import type { Transaction } from '../types'
import dayjs from 'dayjs'

/** Average age (days) of the last N expense transactions. */
export function computeAgeOfMoney(
  transactions: Transaction[],
  sampleSize = 10,
  today = dayjs(),
): number {
  const recent = transactions
    .filter((t) => t.type === 'expense' && !t.isCardLoan)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, sampleSize)

  if (recent.length === 0) return 0

  const ages = recent.map((t) => today.startOf('day').diff(dayjs(t.date).startOf('day'), 'day'))
  return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
}
