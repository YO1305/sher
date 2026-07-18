import dayjs, { type Dayjs } from 'dayjs'
import type { CreditCard, Debt, Transaction } from '../types'

/** Next statement close date on/after `from`. */
export function nextStatementDate(card: CreditCard, from: Dayjs = dayjs()): Dayjs {
  const day = Math.min(28, Math.max(1, card.billingDay ?? 1))
  let stmt = from.date(Math.min(day, from.daysInMonth()))
  if (stmt.isBefore(from, 'day')) {
    const next = from.add(1, 'month')
    stmt = next.date(Math.min(day, next.daysInMonth()))
  }
  return stmt.startOf('day')
}

/** Due date = statement + grace days (or purchase + grace if no billing day). */
export function calcCardDueDate(
  card: CreditCard,
  purchaseDate: string,
): string {
  const purchase = dayjs(purchaseDate)
  const grace = card.gracePeriodDays ?? 30
  if (card.billingDay) {
    const stmt = nextStatementDate(card, purchase)
    return stmt.add(grace, 'day').format('YYYY-MM-DD')
  }
  return purchase.add(grace, 'day').format('YYYY-MM-DD')
}

export function getCardDebtBalance(
  cardId: string,
  transactions: Transaction[],
): { spent: number; paid: number; remaining: number } {
  let spent = 0
  let paid = 0
  for (const tx of transactions) {
    if (tx.isCardLoan && tx.cardId === cardId && tx.type === 'income') {
      spent += tx.amount
    }
    if (
      (tx.category === 'card_pay' || tx.category === 'credit_pay') &&
      tx.type === 'expense' &&
      tx.cardId === cardId
    ) {
      paid += tx.amount
    }
    // Legacy: loan_taken with paymentMethod = card id
    if (
      tx.isCardLoan &&
      !tx.cardId &&
      tx.paymentMethod === cardId &&
      tx.type === 'income'
    ) {
      spent += tx.amount
    }
  }
  return { spent, paid, remaining: Math.max(0, spent - paid) }
}

export function buildCardDebts(
  cards: CreditCard[],
  transactions: Transaction[],
): Debt[] {
  const result: Debt[] = []
  for (const card of cards) {
    const { spent, remaining } = getCardDebtBalance(card.id, transactions)
    if (spent <= 0 || remaining <= 0) continue
    const spends = transactions
      .filter(
        (tx) =>
          tx.isCardLoan &&
          (tx.cardId === card.id || tx.paymentMethod === card.id) &&
          tx.type === 'income',
      )
      .sort((a, b) => b.date.localeCompare(a.date))
    const last = spends[0]
    const dueDate = last ? calcCardDueDate(card, last.date) : undefined
    result.push({
      id: `auto-card-${card.id}`,
      type: 'card',
      name: card.name,
      totalAmount: spent,
      remainingAmount: remaining,
      isPaid: false,
      source: 'auto',
      cardId: card.id,
      dueDate,
      startDate: spends[spends.length - 1]?.date,
      note: dueDate ? `due:${dueDate}` : undefined,
    })
  }
  return result
}

export interface DueAlert {
  id: string
  kind: 'credit' | 'card'
  title: string
  dueDate: string
  amount: number
  daysLeft: number
  urgent: boolean
}

/** Alerts for items due within `withinDays` (default 3) or overdue. */
export function collectDueAlerts(
  debts: Debt[],
  cards: CreditCard[],
  transactions: Transaction[],
  withinDays = 3,
  today = dayjs(),
): DueAlert[] {
  const alerts: DueAlert[] = []

  for (const d of debts) {
    if (d.isPaid || d.remainingAmount <= 0) continue

    if (d.type === 'credit' && d.monthlyPayment) {
      // Approximate due: startDate day each month, or end of current month payment window
      const start = d.startDate ? dayjs(d.startDate) : today
      let due = today.date(Math.min(start.date(), today.daysInMonth()))
      if (due.isBefore(today, 'day')) due = due.add(1, 'month')
      const daysLeft = due.startOf('day').diff(today.startOf('day'), 'day')
      if (daysLeft <= withinDays) {
        alerts.push({
          id: d.id,
          kind: 'credit',
          title: d.contractNumber ? `${d.name} №${d.contractNumber}` : d.name,
          dueDate: due.format('YYYY-MM-DD'),
          amount: Math.min(d.monthlyPayment, d.remainingAmount),
          daysLeft,
          urgent: daysLeft <= withinDays,
        })
      }
    }

    if (d.type === 'card' && d.cardId && d.dueDate) {
      const due = dayjs(d.dueDate)
      const daysLeft = due.startOf('day').diff(today.startOf('day'), 'day')
      if (daysLeft <= withinDays) {
        alerts.push({
          id: d.id,
          kind: 'card',
          title: d.name,
          dueDate: d.dueDate,
          amount: d.remainingAmount,
          daysLeft,
          urgent: true,
        })
      }
    }
  }

  // Also check cards with balance even if debt list missed dueDate
  for (const card of cards) {
    const bal = getCardDebtBalance(card.id, transactions)
    if (bal.remaining <= 0) continue
    if (debts.some((d) => d.cardId === card.id && d.remainingAmount > 0)) continue
    const dueDate = calcCardDueDate(card, today.format('YYYY-MM-DD'))
    const daysLeft = dayjs(dueDate).startOf('day').diff(today.startOf('day'), 'day')
    if (daysLeft <= withinDays) {
      alerts.push({
        id: card.id,
        kind: 'card',
        title: card.name,
        dueDate,
        amount: bal.remaining,
        daysLeft,
        urgent: true,
      })
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft)
}

export function estimateLateInterest(card: CreditCard, remaining: number): number {
  const rate = card.lateInterestPercent ?? 0
  if (rate <= 0 || remaining <= 0) return 0
  return Math.round((remaining * rate) / 100)
}

export function estimateOnTimeFee(card: CreditCard, amount: number): number {
  const rate = card.onTimeFeePercent ?? 0
  if (rate <= 0 || amount <= 0) return 0
  return Math.round((amount * rate) / 100)
}
