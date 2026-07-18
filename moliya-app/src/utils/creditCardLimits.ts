import type { CreditCard, Bank } from '../types'
import type { Account } from '../core/types'
import type { Transaction } from '../types'
import { getCardDebtBalance } from './cardDebt'

export interface CreditCardLimitItem {
  id: string
  name: string
  bankName?: string
  /** Credit limit (if known) */
  limit: number | null
  /** Amount currently owed on the card */
  used: number
  /** Available to spend: limit − used (or account balance) */
  available: number
}

export interface CreditCardLimitsSummary {
  items: CreditCardLimitItem[]
  totalAvailable: number
  totalUsed: number
  totalLimit: number
}

/**
 * Available credit-card limits from settings cards + credit accounts.
 * Settings (incl. cards) sync via Firebase; accounts are local/v2 store.
 */
export function getCreditCardLimits(
  creditCards: CreditCard[],
  accounts: Account[],
  transactions: Transaction[],
  banks: Bank[] = [],
): CreditCardLimitsSummary {
  const bankName = (id?: string) => banks.find((b) => b.id === id)?.name
  const seen = new Set<string>()
  const items: CreditCardLimitItem[] = []

  for (const card of creditCards) {
    const used = getCardDebtBalance(card.id, transactions).remaining
    const linked = accounts.find(
      (a) =>
        a.isActive &&
        a.type === 'credit' &&
        (a.linkedCardId === card.id ||
          a.name.toLowerCase().includes(card.name.toLowerCase())),
    )

    let limit: number | null = card.limit != null && card.limit > 0 ? card.limit : null
    let available: number

    if (limit != null) {
      available = Math.max(0, Math.round(limit - used))
    } else if (linked) {
      // Account balance treated as remaining available credit
      available = Math.max(0, Math.round(linked.balance))
      limit = Math.round(linked.balance + used)
    } else {
      available = 0
      limit = null
    }

    seen.add(card.id)
    if (linked) seen.add(linked.id)

    items.push({
      id: card.id,
      name: card.name,
      bankName: bankName(card.bankId) ?? bankName(linked?.bankId),
      limit,
      used,
      available,
    })
  }

  // Credit accounts not already covered by a settings card
  for (const acc of accounts) {
    if (!acc.isActive || acc.type !== 'credit' || seen.has(acc.id)) continue
    if (acc.linkedCardId && seen.has(acc.linkedCardId)) continue

    items.push({
      id: acc.id,
      name: acc.name,
      bankName: bankName(acc.bankId),
      limit: Math.round(acc.balance),
      used: 0,
      available: Math.max(0, Math.round(acc.balance)),
    })
  }

  const totalAvailable = items.reduce((s, i) => s + i.available, 0)
  const totalUsed = items.reduce((s, i) => s + i.used, 0)
  const totalLimit = items.reduce((s, i) => s + (i.limit ?? i.available + i.used), 0)

  return { items, totalAvailable, totalUsed, totalLimit }
}
