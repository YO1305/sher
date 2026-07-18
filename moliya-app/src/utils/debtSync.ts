import type { Debt, DebtType, Transaction } from '../types'

function norm(name: string) {
  return name.trim().toLowerCase()
}

export function namesMatch(a: string, b: string) {
  return norm(a) === norm(b)
}

function debtKey(type: DebtType, name: string, contractNumber?: string) {
  if (type === 'credit' && contractNumber) {
    return `${type}:${norm(name)}:${norm(contractNumber)}`
  }
  return `${type}:${norm(name)}`
}

function autoId(type: DebtType, name: string, contractNumber?: string) {
  const base = contractNumber
    ? `${type}-${norm(name)}-${norm(contractNumber)}`
    : `${type}-${norm(name)}`
  return `auto-${base.replace(/\s+/g, '-')}`
}

function safeAmount(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(v) ? Math.round(v) : 0
}

/** Normalize category key (handles legacy labels / aliases). */
export function normalizeLoanCategory(category: string): string {
  const c = (category ?? '').trim()
  const lower = c.toLowerCase()
  if (
    c === 'loan_given' ||
    lower.includes('qarz berish') ||
    lower.includes('қарз бериш') ||
    lower.includes('выданн') ||
    lower === 'карз бериш'
  ) {
    return 'loan_given'
  }
  if (
    c === 'loan_taken' ||
    lower.includes('qarz olish') ||
    lower.includes('қарз олиш') ||
    lower.includes('взятый') ||
    lower === 'карз олиш'
  ) {
    return 'loan_taken'
  }
  if (
    c === 'loan_return' ||
    lower.includes('qaytar') ||
    lower.includes('возврат') ||
    lower.includes('қайтариш')
  ) {
    return 'loan_return'
  }
  if (
    c === 'loan_pay' ||
    lower.includes('qarz to') ||
    lower.includes('погашение займа') ||
    lower.includes('қарз тўлаш') ||
    lower.includes('карз тулаш')
  ) {
    return 'loan_pay'
  }
  if (
    c === 'credit_pay' ||
    lower.includes('kredit to') ||
    lower.includes('погашение кредита') ||
    lower.includes('кредит тўлаш')
  ) {
    return 'credit_pay'
  }
  return c
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
  try {
    const sorted = [...(transactions ?? [])].sort((a, b) => {
      const da = a.date ?? ''
      const db = b.date ?? ''
      if (da !== db) return da.localeCompare(db)
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    })

    const map = new Map<string, Acc>()

    const bump = (
      type: DebtType,
      name: string,
      delta: number,
      meta: { date: string; note?: string },
    ) => {
      if (!name.trim() || delta === 0) return
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

    const findExistingType = (
      preferred: DebtType[],
      name: string,
    ): DebtType | null => {
      for (const t of preferred) {
        if (map.has(debtKey(t, name))) return t
      }
      return null
    }

    for (const tx of sorted) {
      const name = (tx.counterparty ?? '').trim()
      if (!name) continue
      const amount = safeAmount(tx.amount)
      if (amount <= 0) continue

      const category = normalizeLoanCategory(tx.category)
      const meta = { date: tx.date ?? '', note: tx.description }

      if (category === 'loan_given' && tx.type === 'expense') {
        bump('lend', name, amount, meta)
        continue
      }
      if (category === 'loan_return' && tx.type === 'income') {
        bump('lend', name, -amount, meta)
        continue
      }
      if (category === 'loan_taken' && tx.type === 'income') {
        bump(tx.isCardLoan ? 'credit' : 'owe', name, amount, meta)
        continue
      }
      if (category === 'loan_pay' && tx.type === 'expense') {
        const t = findExistingType(['owe', 'credit'], name) ?? 'owe'
        bump(t, name, -amount, meta)
        continue
      }
      if (category === 'credit_pay' && tx.type === 'expense') {
        const t = findExistingType(['credit', 'owe'], name) ?? 'credit'
        bump(t, name, -amount, meta)
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
  } catch (err) {
    console.error('buildDebtsFromTransactions failed', err)
    return []
  }
}

/** Auto (from ops) is source of truth for personal debts.
 *  Manual credits with contract number stay separate from card auto-debts.
 */
export function mergeDebts(manual: Debt[], auto: Debt[]): Debt[] {
  const result: Debt[] = []
  const usedManual = new Set<string>()

  for (const a of auto) {
    const key = debtKey(a.type, a.name, a.contractNumber)
    const m = (manual ?? []).find(
      (x) => debtKey(x.type, x.name, x.contractNumber) === key,
    )
    if (m) usedManual.add(key)
    // Prefer structured manual credit over thin auto aggregate
    if (m && m.type === 'credit' && (m.contractNumber || m.monthsTotal)) {
      result.push({
        ...m,
        source: 'manual',
        remainingAmount: m.remainingAmount,
        totalAmount: Math.max(m.totalAmount, a.totalAmount),
        isPaid: m.remainingAmount <= 0,
      })
    } else {
      result.push({
        ...a,
        monthlyPayment: m?.monthlyPayment ?? a.monthlyPayment,
        note: a.note || m?.note,
        bankId: m?.bankId ?? a.bankId,
        contractNumber: m?.contractNumber ?? a.contractNumber,
        monthsTotal: m?.monthsTotal ?? a.monthsTotal,
      })
    }
  }

  for (const m of manual ?? []) {
    const key = debtKey(m.type, m.name, m.contractNumber)
    if (usedManual.has(key)) continue
    result.push({ ...m, source: m.source ?? 'manual' })
  }

  return result
}

export function getDebtHistory(
  transactions: Transaction[],
  debtName: string,
  debtId?: string,
): Transaction[] {
  return (transactions ?? [])
    .filter((tx) => {
      if (debtId && (tx.creditId === debtId || tx.debtId === debtId)) return true
      return (
        !!tx.counterparty &&
        namesMatch(tx.counterparty, debtName) &&
        isLoanRelated(tx)
      )
    })
    .sort(
      (a, b) =>
        (b.date ?? '').localeCompare(a.date ?? '') ||
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    )
}

export function isLoanRelated(tx: Pick<Transaction, 'category' | 'type'>): boolean {
  const category = normalizeLoanCategory(tx.category)
  return (
    (category === 'loan_given' && tx.type === 'expense') ||
    (category === 'loan_return' && tx.type === 'income') ||
    (category === 'loan_taken' && tx.type === 'income') ||
    (category === 'loan_pay' && tx.type === 'expense') ||
    (category === 'credit_pay' && tx.type === 'expense')
  )
}

export function summarizeDebts(debts: Debt[]) {
  const active = (debts ?? []).filter((d) => !d.isPaid && d.remainingAmount > 0)
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
