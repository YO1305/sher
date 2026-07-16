import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useTransactionStore } from '../store/transactionStore'
import { useSettingsStore } from '../store/settingsStore'
import type { Transaction } from '../types'

export function useBalance(transactions?: Transaction[]) {
  const storeTxs = useTransactionStore((s) => s.transactions)
  const initialBalance = useSettingsStore((s) => s.initialBalance)
  const txs = transactions ?? storeTxs

  return useMemo(() => {
    const sorted = [...txs].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    )
    let balance = initialBalance
    const withBalance = sorted.map((tx) => {
      balance += tx.type === 'income' ? tx.amount : -tx.amount
      return { ...tx, runningBalance: balance }
    })
    return {
      balance,
      withBalance,
      getBalanceAfter: (id: string) => withBalance.find((t) => t.id === id)?.runningBalance ?? balance,
    }
  }, [txs, initialBalance])
}

export function useMonthStats(month?: string) {
  const transactions = useTransactionStore((s) => s.transactions)
  const target = month ?? dayjs().format('YYYY-MM')

  return useMemo(() => {
    const monthTxs = transactions.filter((t) => t.date.startsWith(target))
    const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const byCategory: Record<string, number> = {}
    for (const t of monthTxs) {
      if (t.type === 'expense') {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
      }
    }
    return {
      month: target,
      income,
      expense,
      profit: income - expense,
      count: monthTxs.length,
      byCategory,
      transactions: monthTxs,
    }
  }, [transactions, target])
}
