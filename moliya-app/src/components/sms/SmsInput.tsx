import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { useAccountStore } from '../../store/accountStore'
import { useSmsStore } from '../../store/smsStore'
import { useTransactionStore } from '../../store/transactionStore'
import { parsePastedSms, autoCategorizeByPayee } from '../../core/sms-parser'
import type { ParsedSms } from '../../core/types'
import { formatCurrency } from '../../utils/formatCurrency'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories'
import { getCategoryLabel } from '../../utils/categoryHelpers'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function SmsInput({ open, onClose }: Props) {
  const { t } = useTranslation()
  const accounts = useAccountStore((s) => s.accounts)
  const setBalance = useAccountStore((s) => s.setBalance)
  const adjustBalance = useAccountStore((s) => s.adjustBalance)
  const rules = useSmsStore((s) => s.rules)
  const addLog = useSmsStore((s) => s.addLog)
  const addPending = useSmsStore((s) => s.addPending)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const transactions = useTransactionStore((s) => s.transactions)
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const custom = useSettingsStore((s) => s.customCategories)

  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedSms | null>(null)
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')

  const cats =
    parsed?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const catOptions = [
    { value: '', label: `— ${t('validation.category')} —` },
    ...cats.map((c) => ({
      value: c.key,
      label: getCategoryLabel(c.key, t, overrides, custom),
    })),
  ]
  const accOptions = [
    { value: '', label: `— ${t('accounts.select')} —` },
    ...accounts
      .filter((a) => a.isActive)
      .map((a) => ({
        value: a.id,
        label: a.cardMask ? `${a.name} *${a.cardMask}` : a.name,
      })),
  ]

  const handleParse = () => {
    setError('')
    const result = parsePastedSms(text.trim(), accounts, rules)
    if (!result || !result.matched || result.amount == null) {
      setParsed(null)
      setError(t('sms.notRecognized'))
      addLog({
        text: text.trim(),
        status: 'unmatched',
        at: new Date().toISOString(),
      })
      return
    }
    setParsed(result)
    setAccountId(result.accountId ?? '')
    const suggested =
      result.rule?.defaultCategoryKey ||
      autoCategorizeByPayee(result.payee, transactions) ||
      ''
    setCategory(suggested)
  }

  const handleSave = () => {
    if (!parsed?.amount || !parsed.type) return
    if (!category) {
      setError(t('validation.category'))
      return
    }
    const acc = accountId || parsed.accountId

    if (parsed.confidence === 'high' && category) {
      addTransaction({
        type: parsed.type,
        amount: parsed.amount,
        category,
        date: dayjs().format('YYYY-MM-DD'),
        counterparty: parsed.payee,
        description: parsed.rawSms.slice(0, 120),
        paymentMethod: 'cash',
      })
      if (acc) {
        if (parsed.balance != null) setBalance(acc, parsed.balance)
        else
          adjustBalance(
            acc,
            parsed.type === 'income' ? parsed.amount : -parsed.amount,
          )
      }
      addLog({
        text: parsed.rawSms,
        status: 'created',
        at: new Date().toISOString(),
      })
    } else {
      addPending({
        date: dayjs().format('YYYY-MM-DD'),
        amount: parsed.amount,
        type: parsed.type,
        accountId: acc,
        category,
        payee: parsed.payee,
        rawSms: parsed.rawSms,
        confidence: parsed.confidence,
      })
      addLog({
        text: parsed.rawSms,
        status: 'pending',
        at: new Date().toISOString(),
      })
    }

    setText('')
    setParsed(null)
    setCategory('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('sms.pasteTitle')}>
      <p className="mb-2 text-sm text-muted">{t('sms_paste_hint')}</p>
      <textarea
        className="min-h-[120px] w-full rounded-xl border border-border bg-surface2 p-3 text-sm text-slate-100 outline-none focus:border-primary"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('sms.examplePlaceholder')}
      />
      <Button className="mt-3 w-full" variant="secondary" onClick={handleParse}>
        {t('sms.recognize')}
      </Button>

      {error && <p className="mt-2 text-sm text-expense">{error}</p>}

      {parsed?.matched && parsed.amount != null && (
        <div className="mt-4 space-y-3 rounded-xl border border-income/30 bg-income/5 p-3">
          <p className="text-sm font-medium text-income">{t('sms_recognized')}</p>
          <p className="font-mono text-lg">
            {parsed.type === 'expense' ? '−' : '+'}
            {formatCurrency(parsed.amount)}
          </p>
          <Select
            label={t('accounts.select')}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={accOptions}
          />
          <Select
            label={t('category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={catOptions}
          />
          <Button className="w-full" onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      )}
    </Modal>
  )
}
