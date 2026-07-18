import { useTranslation } from 'react-i18next'
import { useSmsStore, pendingToTransactionDraft } from '../../store/smsStore'
import { useTransactionStore } from '../../store/transactionStore'
import { useAccountStore } from '../../store/accountStore'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { formatCurrency } from '../../utils/formatCurrency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories'
import { getCategoryLabel } from '../../utils/categoryHelpers'
import { useSettingsStore } from '../../store/settingsStore'
import { useState } from 'react'

export function PendingList() {
  const { t } = useTranslation()
  const pending = useSmsStore((s) => s.pending)
  const confirmPending = useSmsStore((s) => s.confirmPending)
  const dismissPending = useSmsStore((s) => s.dismissPending)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const adjustBalance = useAccountStore((s) => s.adjustBalance)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)
  const [cats, setCats] = useState<Record<string, string>>({})

  if (pending.length === 0) return null

  return (
    <div className="space-y-2 rounded-xl border border-gold/40 bg-gold/10 p-3">
      <p className="text-sm font-semibold text-gold">
        {t('pending_sms', { count: pending.length })}
      </p>
      <ul className="space-y-2">
        {pending.map((p) => {
          const list = p.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
          const options = [
            { value: '', label: `— ${t('validation.category')} —` },
            ...list.map((c) => ({
              value: c.key,
              label: getCategoryLabel(c.key, t, overrides, custom),
            })),
          ]
          const cat = cats[p.id] ?? p.category ?? ''
          return (
            <li key={p.id} className="rounded-lg bg-surface/80 p-3">
              <p className="text-sm font-medium">
                {p.type === 'expense' ? '−' : '+'}
                {formatCurrency(p.amount)}
              </p>
              <p className="truncate text-[10px] text-muted">{p.rawSms}</p>
              <Select
                className="mt-2"
                value={cat}
                onChange={(e) =>
                  setCats((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
                options={options}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (!cat) return
                    const confirmed = confirmPending(p.id, cat)
                    if (!confirmed) return
                    const draft = pendingToTransactionDraft({
                      ...confirmed,
                      category: cat,
                    })
                    addTransaction(draft)
                    if (confirmed.accountId) {
                      adjustBalance(
                        confirmed.accountId,
                        confirmed.type === 'income'
                          ? confirmed.amount
                          : -confirmed.amount,
                      )
                    }
                  }}
                >
                  {t('sms.confirm')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissPending(p.id)}
                >
                  {t('delete')}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
