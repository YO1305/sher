import type { Debt, DebtType, Transaction } from '../types'

function norm(name: string) {
  return name.trim().toLowerCase()
}

export function namesMatch(a: string, b: string) {
  return norm(a) === norm(b)
}

/** Which debt type a loan-related category affects, and the signed delta direction. */
export function getDebtEffect(
  category: string,
  type: Transaction['type'],
): { debtType: DebtType; sign: 1 | -1 } | null {
  if (category === 'loan_taken' && type === 'income') return { debtType: 'owe', sign: 1 }
  if (category === 'loan_given' && type === 'expense') return { debtType: 'lend', sign: 1 }
  if (category === 'loan_pay' && type === 'expense') return { debtType: 'owe', sign: -1 }
  if (category === 'loan_return' && type === 'income') return { debtType: 'lend', sign: -1 }
  if (category === 'credit_pay' && type === 'expense') return { debtType: 'credit', sign: -1 }
  return null
}

function findDebt(debts: Debt[], debtType: DebtType, name: string): Debt | undefined {
  const unpaid = debts.find(
    (d) => d.type === debtType && namesMatch(d.name, name) && !d.isPaid,
  )
  if (unpaid) return unpaid
  return debts.find((d) => d.type === debtType && namesMatch(d.name, name))
}

/**
 * Apply or revert a transaction's effect on the debts list.
 * Returns the next debts array (immutable).
 */
export function applyTxToDebts(
  debts: Debt[],
  tx: Pick<Transaction, 'category' | 'type' | 'amount' | 'counterparty' | 'date' | 'description'>,
  mode: 'apply' | 'revert',
): Debt[] {
  const counterparty = tx.counterparty?.trim()
  if (!counterparty) return debts

  const effect = getDebtEffect(tx.category, tx.type)
  if (!effect) return debts

  const delta = (mode === 'apply' ? 1 : -1) * effect.sign * tx.amount

  // credit_pay: prefer bank credit debt, else personal owe (e.g. credit cards)
  if (tx.category === 'credit_pay') {
    return applyCreditPayToDebts(debts, counterparty, tx.amount, mode, {
      startDate: tx.date,
    })
  }

  return adjustDebt(debts, effect.debtType, counterparty, delta, {
    startDate: tx.date,
    note: tx.description,
  })
}

export function adjustDebt(
  debts: Debt[],
  debtType: DebtType,
  name: string,
  delta: number,
  meta?: { startDate?: string; note?: string },
): Debt[] {
  if (!name.trim() || delta === 0) return debts

  const existing = findDebt(debts, debtType, name)

  if (!existing) {
    if (delta <= 0) return debts
    return [
      ...debts,
      {
        id: crypto.randomUUID(),
        type: debtType,
        name: name.trim(),
        totalAmount: delta,
        remainingAmount: delta,
        startDate: meta?.startDate,
        note: meta?.note,
        isPaid: false,
      },
    ]
  }

  return debts.map((d) => {
    if (d.id !== existing.id) return d
    const remainingAmount = Math.max(0, d.remainingAmount + delta)
    const nextTotal = delta > 0 ? d.totalAmount + delta : d.totalAmount
    return {
      ...d,
      totalAmount: Math.max(nextTotal, remainingAmount),
      remainingAmount,
      isPaid: remainingAmount <= 0,
      name: d.name.trim() || name.trim(),
    }
  })
}

/** Transactions that belong to a debt contact (by counterparty name). */
export function getDebtHistory(
  transactions: Transaction[],
  debtName: string,
): Transaction[] {
  return transactions
    .filter((tx) => tx.counterparty && namesMatch(tx.counterparty, debtName))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
}

/** Prefer credit debt for bank card repayments; fall back to owe. */
export function applyCreditPayToDebts(
  debts: Debt[],
  name: string,
  amount: number,
  mode: 'apply' | 'revert',
  meta?: { startDate?: string },
): Debt[] {
  const delta = (mode === 'apply' ? -1 : 1) * amount
  const credit = findDebt(debts, 'credit', name)
  if (credit) return adjustDebt(debts, 'credit', name, delta, meta)
  const owe = findDebt(debts, 'owe', name)
  if (owe) return adjustDebt(debts, 'owe', name, delta, meta)
  // Creating on revert of a pay doesn't make sense; on apply with no debt, create owe
  if (mode === 'apply' && delta < 0) {
    // Paying without existing debt — create zero then adjust (no-op remaining)
    return debts
  }
  if (mode === 'revert' && delta > 0) {
    return adjustDebt(debts, 'owe', name, delta, meta)
  }
  return debts
}
