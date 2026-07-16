export interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  counterparty?: string
  description?: string
  createdAt: string
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

export interface Settings {
  userName: string
  language: 'uz' | 'ru'
  initialBalance: number
  currency: 'UZS'
  onboardingDone: boolean
}

export type TransactionType = Transaction['type']
export type DebtType = Debt['type']
