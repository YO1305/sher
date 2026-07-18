import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useSettingsStore } from '../../store/settingsStore'

export function CreditCardSettings() {
  const { t } = useTranslation()
  const banks = useSettingsStore((s) => s.banks)
  const creditCards = useSettingsStore((s) => s.creditCards)
  const addCreditCard = useSettingsStore((s) => s.addCreditCard)
  const updateCreditCard = useSettingsStore((s) => s.updateCreditCard)
  const deleteCreditCard = useSettingsStore((s) => s.deleteCreditCard)

  const [newName, setNewName] = useState('')
  const [newBankId, setNewBankId] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBankId, setEditBankId] = useState('')
  const [editLimit, setEditLimit] = useState('')

  const bankOptions = [
    { value: '', label: `— ${t('settings.bankOptional')} —` },
    ...banks.map((b) => ({ value: b.id, label: b.name })),
  ]

  const bankName = (id?: string) => banks.find((b) => b.id === id)?.name

  const handleAdd = () => {
    if (!newName.trim()) return
    addCreditCard({
      name: newName,
      bankId: newBankId || undefined,
      limit: newLimit ? Number(newLimit) : undefined,
    })
    setNewName('')
    setNewBankId('')
    setNewLimit('')
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateCreditCard(editingId, {
      name: editName,
      bankId: editBankId || undefined,
      limit: editLimit ? Number(editLimit) : undefined,
    })
    setEditingId(null)
  }

  return (
    <section className="space-y-3 rounded-xl bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CreditCard size={16} className="text-primary-light" />
        {t('settings.creditCards')}
      </div>
      <p className="text-xs text-muted">{t('settings.creditCardsHint')}</p>

      <div className="space-y-2">
        {creditCards.map((card) => (
          <div key={card.id} className="rounded-lg bg-surface2 px-3 py-2">
            {editingId === card.id ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('settings.cardName')}
                />
                <Select
                  value={editBankId}
                  onChange={(e) => setEditBankId(e.target.value)}
                  options={bankOptions}
                />
                <Input
                  inputMode="numeric"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={t('settings.cardLimit')}
                />
                <Button variant="secondary" className="w-full" onClick={saveEdit}>
                  {t('save')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{card.name}</p>
                  <p className="text-[10px] text-muted">
                    {bankName(card.bankId) ?? t('settings.noBank')}
                    {card.limit ? ` · lim ${card.limit.toLocaleString('uz-UZ')}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(card.id)
                    setEditName(card.name)
                    setEditBankId(card.bankId ?? '')
                    setEditLimit(card.limit != null ? String(card.limit) : '')
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-primary-light"
                >
                  <Pencil size={14} />
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
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('settings.cardName')}
        />
        <Select
          value={newBankId}
          onChange={(e) => setNewBankId(e.target.value)}
          options={bankOptions}
        />
        <Input
          inputMode="numeric"
          value={newLimit}
          onChange={(e) => setNewLimit(e.target.value.replace(/[^\d]/g, ''))}
          placeholder={t('settings.cardLimit')}
        />
        <Button className="w-full" onClick={handleAdd}>
          <Plus size={16} />
          {t('add')}
        </Button>
      </div>
    </section>
  )
}
