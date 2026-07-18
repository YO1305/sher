export interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  counterparty?: string
  description?: string
  createdAt: string
  /** 'cash' | 'debit' | credit card id */
  paymentMethod?: string
  /** Paired tx id for credit-card dual entry */
  linkedTxId?: string
  /** Auto-created loan_taken from credit card spend */
  isCardLoan?: boolean
  /** Link to a specific credit debt when paying / managing it */
  creditId?: string
  /** Link to credit card entity */
  cardId?: string
  /** Link to a personal debt (owe/lend) */
  debtId?: string
  /** Internal transfer: to_savings | from_savings */
  transferKind?: 'to_savings' | 'from_savings'
}

export interface Bank {
  id: string
  name: string
}

export interface CreditCard {
  id: string
  name: string
  bankId?: string
  limit?: number
  /** Day of month statement closes (1–28) */
  billingDay?: number
  /** Interest-free days after statement (or after purchase if no billing day) */
  gracePeriodDays?: number
  /** Service fee % if paid on time within grace (0 = none) */
  onTimeFeePercent?: number
  /** Monthly interest % after grace period ends */
  lateInterestPercent?: number
}

export interface Debt {
  id: string
  type: 'credit' | 'owe' | 'lend' | 'card'
  name: string
  totalAmount: number
  remainingAmount: number
  monthlyPayment?: number
  startDate?: string
  note?: string
  isPaid: boolean
  /** auto = computed from transactions; manual = added in Debts UI */
  source?: 'auto' | 'manual'
  /** Bank credit fields */
  bankId?: string
  contractNumber?: string
  monthsTotal?: number
  /** Credit card debt */
  cardId?: string
  /** Payment due date YYYY-MM-DD */
  dueDate?: string
}

export interface CustomCategory {
  key: string
  type: 'income' | 'expense'
  label: string
  color: string
}

export interface CategoryOverride {
  key: string
  label?: string
  hidden?: boolean
}

export interface Settings {
  userName: string
  language: 'uz' | 'ru'
  initialBalance: number
  currency: 'UZS'
  onboardingDone: boolean
  banks: Bank[]
  creditCards: CreditCard[]
  customCategories: CustomCategory[]
  categoryOverrides: CategoryOverride[]
  savingsBalance: number
}

export type TransactionType = Transaction['type']
export type DebtType = Debt['type']

export const DEFAULT_BANKS: Bank[] = [
  { id: 'bank-tbc', name: 'TBC' },
  { id: 'bank-hamkorbank', name: 'Hamkorbank' },
]

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-tbc',
    name: 'TBC',
    bankId: 'bank-tbc',
    billingDay: 1,
    gracePeriodDays: 30,
    onTimeFeePercent: 0,
    lateInterestPercent: 3,
  },
  {
    id: 'card-hamkorbank',
    name: 'Hamkorbank',
    bankId: 'bank-hamkorbank',
    billingDay: 5,
    gracePeriodDays: 25,
    onTimeFeePercent: 0,
    lateInterestPercent: 3,
  },
]

export const LOAN_CATEGORIES = {
  loan_taken: 'loan_taken',
  loan_return: 'loan_return',
  loan_given: 'loan_given',
  loan_pay: 'loan_pay',
  credit_pay: 'credit_pay',
  card_pay: 'card_pay',
} as const
