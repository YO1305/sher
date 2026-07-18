import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { useAccountStore, ACCOUNT_TYPE_OPTIONS } from '../store/accountStore'
import { useSettingsStore } from '../store/settingsStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import type { AccountType } from '../core/types'
import { BANKS_REGISTRY } from '../core/sms-rules'

export function Accounts() {
  const { t } = useTranslation()
  const accounts = useAccountStore((s) => s.accounts)
  const ensure = useAccountStore((s) => s.ensureDefaultAccounts)
  const addAccount = useAccountStore((s) => s.addAccount)
  const updateAccount = useAccountStore((s) => s.updateAccount)
  const deleteAccount = useAccountStore((s) => s.deleteAccount)
  const initialBalance = useSettingsStore((s) => s.initialBalance)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('card')
  const [balance, setBalance] = useState('')
  const [cardMask, setCardMask] = useState('')
  const [bankId, setBankId] = useState('')
  const [smsEnabled, setSmsEnabled] = useState(true)

  useEffect(() => {
    ensure(initialBalance)
  }, [ensure, initialBalance])

  const bankOptions = [
    { value: '', label: `— ${t('settings.bankOptional')} —` },
    ...Object.entries(BANKS_REGISTRY).map(([id, b]) => ({
      value: id,
      label: b.name,
    })),
  ]

  const typeOptions = ACCOUNT_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }))

  const handleAdd = () => {
    if (!name.trim()) return
    addAccount({
      name: name.trim(),
      type,
      balance: Math.round(Number(balance) || 0),
      color: BANKS_REGISTRY[bankId]?.color ?? '#388BFD',
      icon: 'CreditCard',
      bankId: bankId || undefined,
      cardMask: cardMask.trim() || undefined,
      smsEnabled,
      isActive: true,
    })
    setOpen(false)
    setName('')
    setBalance('')
    setCardMask('')
    setBankId('')
  }

  const total = accounts
    .filter((a) => a.isActive && a.type !== 'credit' && a.type !== 'debt')
    .reduce((s, a) => s + a.balance, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight2">{t('nav.accounts')}</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={16} />
          {t('accounts.add')}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-muted">{t('accounts.total')}</p>
        <p className="mt-1 font-mono text-2xl font-bold text-gold">
          {formatCurrency(total)}
        </p>
      </div>

      <ul className="space-y-2">
        {accounts.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${a.color}22`, color: a.color }}
            >
              <Wallet size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.name}</p>
              <p className="text-[10px] text-muted">
                {t(
                  ACCOUNT_TYPE_OPTIONS.find((o) => o.value === a.type)?.labelKey ??
                    'accounts.typeCash',
                )}
                {a.cardMask ? ` · *${a.cardMask}` : ''}
                {a.smsEnabled ? ` · SMS` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold">{formatCurrency(a.balance)}</p>
              <button
                type="button"
                className="mt-1 text-[10px] text-muted hover:text-expense"
                onClick={() => {
                  const next = window.prompt(t('accounts.setBalance'), String(a.balance))
                  if (next == null) return
                  const n = Math.round(Number(next.replace(/\s/g, '')))
                  if (Number.isFinite(n)) updateAccount(a.id, { balance: n })
                }}
              >
                {t('accounts.editBalance')}
              </button>
            </div>
            {a.id !== 'acc-cash' && (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center text-muted hover:text-expense"
                onClick={() => {
                  if (window.confirm(t('confirmDelete'))) deleteAccount(a.id)
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Modal open={open} onClose={() => setOpen(false)} title={t('accounts.add')}>
        <div className="space-y-3">
          <Input
            label={t('accounts.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            label={t('accounts.type')}
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            options={typeOptions}
          />
          <Input
            label={t('accounts.balance')}
            inputMode="numeric"
            value={balance}
            onChange={(e) => setBalance(e.target.value.replace(/[^\d]/g, ''))}
          />
          <Select
            label={t('settings.banks')}
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            options={bankOptions}
          />
          <Input
            label={t('accounts.cardMask')}
            value={cardMask}
            maxLength={4}
            onChange={(e) => setCardMask(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
          />
          <label className="flex min-h-[44px] items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
            />
            {t('accounts.smsEnabled')}
          </label>
          <Button className="w-full" onClick={handleAdd}>
            {t('save')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
