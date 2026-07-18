import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Search } from 'lucide-react'
import { useTransactionStore } from '../../store/transactionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useBalance } from '../../hooks/useBalance'
import { resolveCategories } from '../../utils/categoryHelpers'
import { TransactionCard } from './TransactionCard'
import { TransactionRow } from './TransactionRow'
import { Select } from '../ui/Select'

interface Props {
  limit?: number
  showFilters?: boolean
}

export function TransactionList({ limit, showFilters = true }: Props) {
  const { t } = useTranslation()
  const transactions = useTransactionStore((s) => s.transactions)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)
  const { withBalance } = useBalance()

  const allCategoryOptions = useMemo(() => {
    const income = resolveCategories('income', t, overrides, custom)
    const expense = resolveCategories('expense', t, overrides, custom)
    return [...income, ...expense]
  }, [t, overrides, custom])

  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const [category, setCategory] = useState('all')
  const [month, setMonth] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const months = useMemo(() => {
    const set = new Set(transactions.map((tx) => tx.date.slice(0, 7)))
    return Array.from(set).sort().reverse()
  }, [transactions])

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of withBalance) map.set(tx.id, tx.runningBalance)
    return map
  }, [withBalance])

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (type !== 'all') list = list.filter((tx) => tx.type === type)
    if (category !== 'all') list = list.filter((tx) => tx.category === category)
    if (month !== 'all') list = list.filter((tx) => tx.date.startsWith(month))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (tx) =>
          (tx.counterparty ?? '').toLowerCase().includes(q) ||
          (tx.description ?? '').toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'amount') return (a.amount - b.amount) * mul
      return (a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)) * mul
    })
    if (limit) list = list.slice(0, limit)
    return list
  }, [transactions, type, category, month, search, sortKey, sortDir, limit])

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof filtered }[] = []
    const today = dayjs().format('YYYY-MM-DD')
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    for (const tx of filtered) {
      let label = dayjs(tx.date).format('DD MMMM YYYY')
      if (tx.date === today) label = t('today')
      else if (tx.date === yesterday) label = t('yesterday')
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(tx)
      else groups.push({ label, items: [tx] })
    }
    return groups
  }, [filtered, t])

  const toggleSort = (key: 'date' | 'amount') => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="space-y-3 rounded-xl bg-surface p-3 md:p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="h-11 w-full rounded-xl border border-border bg-surface2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              options={[
                { value: 'all', label: t('all') },
                { value: 'income', label: t('income') },
                { value: 'expense', label: t('expense') },
              ]}
            />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'all', label: t('category') },
                ...allCategoryOptions.map((c) => ({
                  value: c.key,
                  label: c.label,
                })),
              ]}
            />
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={[
                { value: 'all', label: t('month') },
                ...months.map((m) => ({ value: m, label: dayjs(m + '-01').format('MMMM YYYY') })),
              ]}
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface px-4 py-10 text-center text-muted">
          <p>{t('noTransactions')}</p>
          <p className="mt-1 text-sm">{t('empty.hint')}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      runningBalance={balanceMap.get(tx.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[720px]">
              <thead className="bg-surface2 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="cursor-pointer px-3 py-3" onClick={() => toggleSort('date')}>
                    {t('date')}
                  </th>
                  <th className="px-3 py-3">{t('category')}</th>
                  <th className="px-3 py-3">{t('counterparty')}</th>
                  <th className="px-3 py-3">{t('description')}</th>
                  <th
                    className="cursor-pointer px-3 py-3 text-right"
                    onClick={() => toggleSort('amount')}
                  >
                    {t('amount')}
                  </th>
                  <th className="px-3 py-3 text-right">{t('balance.current')}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    runningBalance={balanceMap.get(tx.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
