/** YNAB / Zen Money models (Moliya SaaS v2) — amounts in whole UZS (integer). */

export type AccountType = 'cash' | 'card' | 'wallet' | 'credit' | 'debt'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: 'UZS'
  color: string
  icon: string
  bankId?: string
  cardMask?: string
  smsEnabled: boolean
  isActive: boolean
  createdAt: string
  /** Link to existing CreditCard entity */
  linkedCardId?: string
}

export type EnvelopeGoalType = 'target_balance' | 'target_by_date' | 'monthly_fill'

export interface Envelope {
  id: string
  categoryKey: string
  month: string
  assigned: number
  activity: number
  available: number
  rolledOver: number
  goalType?: EnvelopeGoalType
  goalAmount?: number
  goalDate?: string
  note?: string
}

export type EnvelopeStatus = 'green' | 'yellow' | 'red' | 'funded' | 'unfunded' | 'empty'

export interface SmsRuleGroups {
  amount?: number
  currency?: number
  balance?: number
  cardMask?: number
  payee?: number
  date?: number
  time?: number
  type: 'income' | 'expense'
}

export interface SmsRule {
  id: string
  bankId: string
  senderId: string
  pattern: string
  groups: SmsRuleGroups
  amountMultiplier?: number
  defaultCategoryKey?: string
  exampleSms: string
}

export interface ParsedSms {
  matched: boolean
  rule?: SmsRule
  accountId?: string
  amount?: number
  balance?: number
  type?: 'income' | 'expense'
  payee?: string
  date?: string
  time?: string
  rawSms: string
  confidence: 'high' | 'medium' | 'low'
}

export interface SmsLogEntry {
  id: string
  text: string
  senderId?: string
  status: 'unmatched' | 'created' | 'pending' | 'ignored'
  at: string
}

export type RolloverStrategy = 'rollover' | 'zero_out'

export interface BudgetSettings {
  rolloverStrategy: RolloverStrategy
  budgetStartDay: number
  ageOfMoneyTarget: number
  hiddenAccountIds: string[]
}

export interface DueBudgetAlert {
  type: 'overspent' | 'unassigned' | 'goal_at_risk'
  categoryKey?: string
  amount?: number
  severity: 'error' | 'warning' | 'info'
}
