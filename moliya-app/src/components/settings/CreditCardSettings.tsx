import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useSettingsStore } from '../../store/settingsStore'
import type { CreditCard as CreditCardType } from '../../types'

const emptyForm = {
  name: '',
  bankId: '',
  limit: '',
  billingDay: '1',
  gracePeriodDays: '30',
  onTimeFeePercent: '0',
  lateInterestPercent: '3',
}

export function CreditCardSettings() {
  const { t } = useTranslation()
  const banks = useSettingsStore((s) => s.banks)
  const creditCards = useSettingsStore((s) => s.creditCards)
  const addCreditCard = useSettingsStore((s) => s.addCreditCard)
  const updateCreditCard = useSettingsStore((s) => s.updateCreditCard)
  const deleteCreditCard = useSettingsStore((s) => s.deleteCreditCard)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const bankOptions = [
    { value: '', label: `— ${t('settings.bankOptional')} —` },
    ...banks.map((b) => ({ value: b.id, label: b.name })),
  ]

  const bankName = (id?: string) => banks.find((b) => b.id === id)?.name

  const loadCard = (card: CreditCardType) => {
    setForm({
      name: card.name,
      bankId: card.bankId ?? '',
      limit: card.limit != null ? String(card.limit) : '',
      billingDay: String(card.billingDay ?? 1),
      gracePeriodDays: String(card.gracePeriodDays ?? 30),
      onTimeFeePercent: String(card.onTimeFeePercent ?? 0),
      lateInterestPercent: String(card.lateInterestPercent ?? 0),
    })
  }

  const toPayload = (): Omit<CreditCardType, 'id'> => ({
    name: form.name.trim(),
    bankId: form.bankId || undefined,
    limit: form.limit ? Number(form.limit) : undefined,
    billingDay: Math.min(28, Math.max(1, Number(form.billingDay) || 1)),
    gracePeriodDays: Math.max(0, Number(form.gracePeriodDays) || 0),
    onTimeFeePercent: Math.max(0, Number(form.onTimeFeePercent) || 0),
    lateInterestPercent: Math.max(0, Number(form.lateInterestPercent) || 0),
  })

  const handleAdd = () => {
    if (!form.name.trim()) return
    addCreditCard(toPayload())
    setForm(emptyForm)
    setAdding(false)
  }

  const handleSave = (id: string) => {
    if (!form.name.trim()) return
    updateCreditCard(id, toPayload())
    setExpandedId(null)
  }

  const FormFields = (
    <div className="space-y-2">
      <Input
        label={t('settings.cardName')}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Select
        label={t('settings.banks')}
        value={form.bankId}
        onChange={(e) => setForm((f) => ({ ...f, bankId: e.target.value }))}
        options={bankOptions}
      />
      <Input
        label={t('settings.cardLimit')}
        inputMode="numeric"
        value={form.limit}
        onChange={(e) =>
          setForm((f) => ({ ...f, limit: e.target.value.replace(/[^\d]/g, '') }))
        }
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          label={t('settings.billingDay')}
          inputMode="numeric"
          value={form.billingDay}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              billingDay: e.target.value.replace(/[^\d]/g, ''),
            }))
          }
        />
        <Input
          label={t('settings.graceDays')}
          inputMode="numeric"
          value={form.gracePeriodDays}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              gracePeriodDays: e.target.value.replace(/[^\d]/g, ''),
            }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label={t('settings.onTimeFee')}
          inputMode="decimal"
          value={form.onTimeFeePercent}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              onTimeFeePercent: e.target.value.replace(/[^\d.]/g, ''),
            }))
          }
        />
        <Input
          label={t('settings.lateInterest')}
          inputMode="decimal"
          value={form.lateInterestPercent}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              lateInterestPercent: e.target.value.replace(/[^\d.]/g, ''),
            }))
          }
        />
      </div>
      <p className="text-[10px] text-muted">{t('settings.cardTermsHint')}</p>
    </div>
  )

  return (
    <section className="space-y-3 rounded-xl bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CreditCard size={16} className="text-primary-light" />
        {t('settings.creditCards')}
      </div>
      <p className="text-xs text-muted">{t('settings.creditCardsHint')}</p>

      <div className="space-y-2">
        {creditCards.map((card) => {
          const open = expandedId === card.id
          return (
            <div key={card.id} className="rounded-lg bg-surface2 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    if (open) setExpandedId(null)
                    else {
                      loadCard(card)
                      setExpandedId(card.id)
                      setAdding(false)
                    }
                  }}
                >
                  <p className="truncate text-sm font-medium">{card.name}</p>
                  <p className="text-[10px] text-muted">
                    {bankName(card.bankId) ?? t('settings.noBank')}
                    {` · ${t('settings.graceDays')}: ${card.gracePeriodDays ?? 30}`}
                    {card.lateInterestPercent
                      ? ` · ${card.lateInterestPercent}%`
                      : ''}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (open) setExpandedId(null)
                    else {
                      loadCard(card)
                      setExpandedId(card.id)
                    }
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted"
                >
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('confirmDelete'))) deleteCreditCard(card.id)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-expense"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {open && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {FormFields}
                  <Button className="w-full" onClick={() => handleSave(card.id)}>
                    {t('save')}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {adding ? (
        <div className="space-y-2 border-t border-border pt-3">
          {FormFields}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAdding(false)}>
              {t('cancel')}
            </Button>
            <Button className="flex-1" onClick={handleAdd}>
              {t('add')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => {
            setForm(emptyForm)
            setAdding(true)
            setExpandedId(null)
          }}
        >
          <Plus size={16} />
          {t('settings.addCard')}
        </Button>
      )}
    </section>
  )
}
