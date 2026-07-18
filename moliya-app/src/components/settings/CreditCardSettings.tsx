import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useSettingsStore } from '../../store/settingsStore'

export function CreditCardSettings() {
  const { t } = useTranslation()
  const creditCards = useSettingsStore((s) => s.creditCards)
  const addCreditCard = useSettingsStore((s) => s.addCreditCard)
  const updateCreditCard = useSettingsStore((s) => s.updateCreditCard)
  const deleteCreditCard = useSettingsStore((s) => s.deleteCreditCard)

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    addCreditCard(newName)
    setNewName('')
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateCreditCard(editingId, editName)
    setEditingId(null)
    setEditName('')
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
          <div
            key={card.id}
            className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2"
          >
            {editingId === card.id ? (
              <input
                className="min-h-[36px] flex-1 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
              />
            ) : (
              <p className="flex-1 text-sm font-medium">{card.name}</p>
            )}
            {editingId === card.id ? (
              <Button variant="secondary" className="!min-h-[36px] !px-3" onClick={saveEdit}>
                {t('save')}
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(card.id)
                    setEditName(card.name)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-primary-light"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('confirmDelete'))) deleteCreditCard(card.id)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-expense"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('settings.cardName')}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          {t('add')}
        </Button>
      </div>
    </section>
  )
}
