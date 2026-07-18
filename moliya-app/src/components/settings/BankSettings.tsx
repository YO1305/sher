import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useSettingsStore } from '../../store/settingsStore'

export function BankSettings() {
  const { t } = useTranslation()
  const banks = useSettingsStore((s) => s.banks)
  const addBank = useSettingsStore((s) => s.addBank)
  const updateBank = useSettingsStore((s) => s.updateBank)
  const deleteBank = useSettingsStore((s) => s.deleteBank)

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!newName.trim()) return
    addBank(newName)
    setNewName('')
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateBank(editingId, editName)
    setEditingId(null)
    setEditName('')
  }

  return (
    <section className="space-y-3 rounded-xl bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Building2 size={16} className="text-primary-light" />
        {t('settings.banks')}
      </div>
      <p className="text-xs text-muted">{t('settings.banksHint')}</p>

      <div className="space-y-2">
        {banks.map((bank) => (
          <div
            key={bank.id}
            className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2"
          >
            {editingId === bank.id ? (
              <input
                className="min-h-[44px] flex-1 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
              />
            ) : (
              <p className="flex-1 text-sm font-medium">{bank.name}</p>
            )}
            {editingId === bank.id ? (
              <Button variant="secondary" className="!min-h-[44px] !px-3" onClick={saveEdit}>
                {t('save')}
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(bank.id)
                    setEditName(bank.name)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-primary-light"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('confirmDelete'))) deleteBank(bank.id)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-expense"
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
            placeholder={t('settings.bankName')}
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
