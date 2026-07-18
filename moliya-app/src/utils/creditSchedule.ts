import dayjs from 'dayjs'
import type { Debt, Transaction } from '../types'

export interface CreditDueInfo {
  creditId: string
  monthlyPayment: number
  /** Months since start that should have been paid */
  monthsElapsed: number
  /** How much should have been paid by now (capped by total) */
  expectedPaid: number
  /** Sum of credit_pay txs linked to this credit */
  actuallyPaid: number
  /** Unpaid portion of the schedule so far */
  overdue: number
  /** Amount due this month = monthly + overdue (capped by remaining) */
  dueThisMonth: number
  remainingAmount: number
}

/** Payments attributed to a credit (by creditId or matching counterparty/name). */
export function getCreditPayments(
  credit: Debt,
  transactions: Transaction[],
): Transaction[] {
  return transactions.filter((tx) => {
    if (tx.category !== 'credit_pay' || tx.type !== 'expense') return false
    if (tx.creditId && tx.creditId === credit.id) return true
    if (
      !tx.creditId &&
      tx.counterparty &&
      tx.counterparty.trim().toLowerCase() === credit.name.trim().toLowerCase()
    ) {
      return true
    }
    if (
      !tx.creditId &&
      credit.contractNumber &&
      tx.counterparty &&
      tx.counterparty.includes(credit.contractNumber)
    ) {
      return true
    }
    return false
  })
}

export function getCreditDueInfo(
  credit: Debt,
  transactions: Transaction[],
  asOf = dayjs(),
): CreditDueInfo {
  const monthly = credit.monthlyPayment ?? 0
  const start = credit.startDate ? dayjs(credit.startDate) : asOf
  const monthsTotal = credit.monthsTotal ?? 0

  let monthsElapsed = Math.max(
    0,
    asOf.startOf('month').diff(start.startOf('month'), 'month') + 1,
  )
  if (monthsTotal > 0) monthsElapsed = Math.min(monthsElapsed, monthsTotal)

  const payments = getCreditPayments(credit, transactions)
  const actuallyPaid = payments.reduce((s, t) => s + t.amount, 0)

  // Past months only — current month's installment is NOT overdue yet
  const pastMonths = Math.max(0, monthsElapsed - 1)
  const expectedThroughLastMonth =
    monthly > 0
      ? Math.min(pastMonths * monthly, credit.totalAmount)
      : 0

  const overdue = Math.max(0, expectedThroughLastMonth - actuallyPaid)

  // If user already overpaid past dues, apply surplus to this month's payment
  const paidTowardCurrent = Math.max(0, actuallyPaid - expectedThroughLastMonth)
  const currentMonthDue = Math.max(0, monthly - paidTowardCurrent)

  const expectedPaid =
    monthly > 0
      ? Math.min(monthsElapsed * monthly, credit.totalAmount)
      : 0

  const remainingAmount = Math.max(0, credit.remainingAmount)
  const dueThisMonth =
    remainingAmount <= 0
      ? 0
      : Math.min(remainingAmount, currentMonthDue + overdue)

  return {
    creditId: credit.id,
    monthlyPayment: monthly,
    monthsElapsed,
    expectedPaid,
    actuallyPaid,
    overdue,
    dueThisMonth,
    remainingAmount,
  }
}

export function sumCreditsDueThisMonth(
  credits: Debt[],
  transactions: Transaction[],
  asOf = dayjs(),
): number {
  return credits
    .filter((c) => c.type === 'credit' && !c.isPaid && c.remainingAmount > 0)
    .reduce((s, c) => s + getCreditDueInfo(c, transactions, asOf).dueThisMonth, 0)
}

export function formatCreditLabel(credit: Debt, bankName?: string): string {
  const parts = [
    bankName || credit.name,
    credit.contractNumber ? `№${credit.contractNumber}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

/**
 * Suggested amount for «погашение кредита».
 * Uses monthlyPayment + overdue from past months only (never doubles current installment).
 */
export function getCreditPaySuggestion(
  credit: Debt,
  transactions: Transaction[],
  asOf = dayjs(),
): number {
  const due = getCreditDueInfo(credit, transactions, asOf)
  const monthly = credit.monthlyPayment ?? 0
  if (due.remainingAmount <= 0) return 0
  const suggested = monthly + due.overdue
  if (suggested <= 0) return Math.min(due.remainingAmount, monthly || due.remainingAmount)
  return Math.min(due.remainingAmount, suggested)
}
