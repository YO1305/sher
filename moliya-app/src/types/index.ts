export interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  counterparty?: string
  description?: string
  createdAt: string
  /** 'cash' or credit card id */
  paymentMethod?: string
  /** Paired tx id for credit-card dual entry */
  linkedTxId?: string
  /** Auto-created loan_taken from credit card spend */
  isCardLoan?: boolean
}

export interface Debt {
  id: string
  type: 'credit' | 'owe' | 'lend'
  name: string
  totalAmount: number
  remainingAmount: number
  monthlyPayment?: number
  startDate?: string
  note?: string
  isPaid: boolean
}

export interface CreditCard {
  id: string
  name: string
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
  creditCards: CreditCard[]
  customCategories: CustomCategory[]
  categoryOverrides: CategoryOverride[]
}

export type TransactionType = Transaction['type']
export type DebtType = Debt['type']

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [
  { id: 'card-tbc', name: 'TBC' },
  { id: 'card-hamkorbank', name: 'Hamkorbank' },
]

export const LOAN_CATEGORIES = {
  loan_taken: 'loan_taken',
  loan_return: 'loan_return',
  loan_given: 'loan_given',
  loan_pay: 'loan_pay',
  credit_pay: 'credit_pay',
} as const
