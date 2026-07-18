import type { Debt, DebtType, Transaction } from '../types'

function norm(name: string) {
  return name.trim().toLowerCase()
}

export function namesMatch(a: string, b: string) {
  return norm(a) === norm(b)
}

function debtKey(type: DebtType, name: string) {
  return `${type}:${norm(name)}`
}

function autoId(type: DebtType, name: string) {
  return `auto-${type}-${norm(name).replace(/\s+/g, '-')}`
}

type Acc = {
  type: DebtType
  name: string
  totalAmount: number
  remainingAmount: number
  startDate?: string
  note?: string
}

/**
 * Build debt balances purely from loan-related transactions.
 *
 * loan_given (expense)  → Menga qarzdorlar (lend)  +
 * loan_return (income)  → Menga qarzdorlar (lend)  −
 * loan_taken (income)   → Men qarzdorman (owe) / Kreditlar if card  +
 * loan_pay (expense)    → decrease owe (else credit) −
 * credit_pay (expense)  → Kreditlar −
 */
export function buildDebtsFromTransactions(transactions: Transaction[]): Debt[] {
  const sorted = [...transactions].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  )

  const map = new Map<string, Acc>()

  const bump = (
    type: DebtType,
    name: string,
    delta: number,
    meta: { date: string; note?: string },
  ) => {
    const key = debtKey(type, name)
    const cur = map.get(key)
    if (!cur) {
      if (delta <= 0) return
      map.set(key, {
        type,
        name: name.trim(),
        totalAmount: delta,
        remainingAmount: delta,
        startDate: meta.date,
        note: meta.note,
      })
      return
    }
    if (delta > 0) {
      cur.totalAmount += delta
      cur.remainingAmount += delta
      if (meta.note) cur.note = meta.note
    } else {
      cur.remainingAmount = Math.max(0, cur.remainingAmount + delta)
    }
  }

  const findExistingType = (preferred: DebtType[], name: string): DebtType | null => {
    for (const t of preferred) {
      if (map.has(debtKey(t, name))) return t
    }
    return null
  }

  for (const tx of sorted) {
    const name = tx.counterparty?.trim()
    if (!name) continue
    const meta = { date: tx.date, note: tx.description }

    if (tx.category === 'loan_given' && tx.type === 'expense') {
      bump('lend', name, tx.amount, meta)
      continue
    }
    if (tx.category === 'loan_return' && tx.type === 'income') {
      bump('lend', name, -tx.amount, meta)
      continue
    }
    if (tx.category === 'loan_taken' && tx.type === 'income') {
      bump(tx.isCardLoan ? 'credit' : 'owe', name, tx.amount, meta)
      continue
    }
    if (tx.category === 'loan_pay' && tx.type === 'expense') {
      const t = findExistingType(['owe', 'credit'], name) ?? 'owe'
      bump(t, name, -tx.amount, meta)
      continue
    }
    if (tx.category === 'credit_pay' && tx.type === 'expense') {
      const t = findExistingType(['credit', 'owe'], name) ?? 'credit'
      bump(t, name, -tx.amount, meta)
    }
  }

  return [...map.values()]
    .filter((d) => d.totalAmount > 0)
    .map(
      (d): Debt => ({
        id: autoId(d.type, d.name),
        type: d.type,
        name: d.name,
        totalAmount: d.totalAmount,
        remainingAmount: d.remainingAmount,
        startDate: d.startDate,
        note: d.note,
        isPaid: d.remainingAmount <= 0,
        source: 'auto',
      }),
    )
}

/** Auto (from ops) is source of truth; manual only if no matching auto. */
export function mergeDebts(manual: Debt[], auto: Debt[]): Debt[] {
  const result: Debt[] = []
  const usedManual = new Set<string>()

  for (const a of auto) {
    const key = debtKey(a.type, a.name)
    const m = manual.find((x) => debtKey(x.type, x.name) === key)
    if (m) usedManual.add(key)
    result.push({
      ...a,
      monthlyPayment: m?.monthlyPayment ?? a.monthlyPayment,
      note: a.note || m?.note,
    })
  }

  for (const m of manual) {
    const key = debtKey(m.type, m.name)
    if (usedManual.has(key)) continue
    result.push({ ...m, source: m.source ?? 'manual' })
  }

  return result
}

export function getDebtHistory(
  transactions: Transaction[],
  debtName: string,
): Transaction[] {
  return transactions
    .filter(
      (tx) =>
        tx.counterparty &&
        namesMatch(tx.counterparty, debtName) &&
        isLoanRelated(tx),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
}

export function isLoanRelated(tx: Pick<Transaction, 'category' | 'type'>): boolean {
  return (
    (tx.category === 'loan_given' && tx.type === 'expense') ||
    (tx.category === 'loan_return' && tx.type === 'income') ||
    (tx.category === 'loan_taken' && tx.type === 'income') ||
    (tx.category === 'loan_pay' && tx.type === 'expense') ||
    (tx.category === 'credit_pay' && tx.type === 'expense')
  )
}

export function summarizeDebts(debts: Debt[]) {
  const active = debts.filter((d) => !d.isPaid && d.remainingAmount > 0)
  const sum = (type: DebtType) =>
    active.filter((d) => d.type === type).reduce((s, d) => s + d.remainingAmount, 0)
  return {
    credit: sum('credit'),
    lend: sum('lend'),
    owe: sum('owe'),
    creditCount: active.filter((d) => d.type === 'credit').length,
    lendCount: active.filter((d) => d.type === 'lend').length,
    oweCount: active.filter((d) => d.type === 'owe').length,
  }
}
