import type { Account, ParsedSms, SmsRule } from './types'
import { DEFAULT_SMS_RULES, PAYEE_CATEGORY_MAP } from './sms-rules'
import type { Transaction } from '../types'

function parseAmountGroup(raw: string): number | null {
  const n = parseFloat(raw.replace(/[\s,]/g, ''))
  if (Number.isNaN(n)) return null
  return Math.round(n)
}

export function parseSms(
  smsText: string,
  senderId: string,
  smsRules: SmsRule[],
  accounts: Account[],
): ParsedSms {
  const candidates = smsRules.filter(
    (r) => r.senderId.toLowerCase() === senderId.toLowerCase(),
  )

  for (const rule of candidates) {
    const regex = new RegExp(rule.pattern, 'i')
    const match = smsText.match(regex)
    if (!match) continue

    let amount: number | undefined
    if (rule.groups.amount != null) {
      const raw = match[rule.groups.amount]
      if (!raw) continue
      const parsed = parseAmountGroup(raw)
      if (parsed == null) continue
      amount = Math.round(parsed * (rule.amountMultiplier ?? 1))
    }

    let accountId: string | undefined
    if (rule.groups.cardMask != null) {
      const mask = match[rule.groups.cardMask]
      const account = accounts.find(
        (a) => a.cardMask === mask && (a.bankId === rule.bankId || !a.bankId),
      )
      accountId = account?.id
    }

    let balance: number | undefined
    if (rule.groups.balance != null) {
      const rawBalance = match[rule.groups.balance]
      if (rawBalance) {
        const b = parseAmountGroup(rawBalance)
        if (b != null) balance = b
      }
    }

    // Also try to pull Qoldiq from full text
    if (balance == null) {
      const balMatch = smsText.match(/[Qq]oldiq[:\s]+(\d[\d\s]+)\s*(?:UZS|so['']m)/i)
      if (balMatch?.[1]) {
        const b = parseAmountGroup(balMatch[1])
        if (b != null) balance = b
      }
    }

    let payee: string | undefined
    if (rule.groups.payee != null) {
      payee = match[rule.groups.payee]?.trim()
    }

    return {
      matched: true,
      rule,
      accountId,
      amount,
      balance,
      type: rule.groups.type,
      payee,
      rawSms: smsText,
      confidence: accountId ? 'high' : amount != null ? 'medium' : 'low',
    }
  }

  return { matched: false, rawSms: smsText, confidence: 'low' }
}

/** Try all rules when sender is unknown (paste flow). */
export function parsePastedSms(
  text: string,
  accounts: Account[],
  rules: SmsRule[] = DEFAULT_SMS_RULES,
): ParsedSms | null {
  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, 'i')
    if (!regex.test(text)) continue
    const parsed = parseSms(text, rule.senderId, rules, accounts)
    if (parsed.matched && parsed.amount != null) return parsed
  }
  // Balance-only fallback
  const balOnly = text.match(/[Qq]oldiq[:\s]+(\d[\d\s]+)\s*(?:UZS|so['']m)/i)
  if (balOnly) {
    return {
      matched: false,
      rawSms: text,
      confidence: 'low',
    }
  }
  return null
}

export function autoCategorizeByPayee(
  payee: string | undefined,
  transactions: Transaction[],
): string | null {
  if (!payee) return null
  const lower = payee.toLowerCase()
  for (const [keyword, categoryKey] of Object.entries(PAYEE_CATEGORY_MAP)) {
    if (lower.includes(keyword)) return categoryKey
  }
  const hist = findMostUsedCategoryForPayee(payee, transactions)
  return hist
}

function findMostUsedCategoryForPayee(
  payee: string,
  transactions: Transaction[],
): string | null {
  const lower = payee.toLowerCase()
  const counts = new Map<string, number>()
  for (const t of transactions) {
    if (!t.counterparty?.toLowerCase().includes(lower) && t.counterparty?.toLowerCase() !== lower) {
      if (t.counterparty?.toLowerCase() !== lower) continue
    }
    if (!t.category) continue
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
  }
  // Broader: any counterparty containing keyword pieces
  if (counts.size === 0) {
    for (const t of transactions) {
      const cp = t.counterparty?.toLowerCase() ?? ''
      if (!cp.includes(lower.slice(0, Math.min(4, lower.length)))) continue
      counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    }
  }
  let best: string | null = null
  let max = 0
  for (const [k, n] of counts) {
    if (n > max) {
      max = n
      best = k
    }
  }
  return best
}
