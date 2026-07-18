import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useSettingsStore } from '../../store/settingsStore'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/categories'
import { nextCustomColor } from '../../utils/categoryHelpers'

export function CategorySettings() {
  const { t } = useTranslation()
  const overrides = useSettingsStore((s) => s.categoryOverrides)
  const customCategories = useSettingsStore((s) => s.customCategories)
  const renameBuiltin = useSettingsStore((s) => s.renameBuiltinCategory)
  const hideBuiltin = useSettingsStore((s) => s.hideBuiltinCategory)
  const restoreBuiltin = useSettingsStore((s) => s.restoreBuiltinCategory)
  const addCustom = useSettingsStore((s) => s.addCustomCategory)
  const updateCustom = useSettingsStore((s) => s.updateCustomCategory)
  const deleteCustom = useSettingsStore((s) => s.deleteCustomCategory)

  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<'income' | 'expense'>('expense')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const builtins = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

  const startEdit = (key: string, currentLabel: string) => {
    setEditingKey(key)
    setEditLabel(currentLabel)
  }

  const saveEdit = () => {
    if (!editingKey || !editLabel.trim()) return
    const isCustom = customCategories.some((c) => c.key === editingKey)
    if (isCustom) updateCustom(editingKey, { label: editLabel })
    else renameBuiltin(editingKey, editLabel)
    setEditingKey(null)
    setEditLabel('')
  }

  const handleAdd = () => {
    if (!newLabel.trim()) return
    addCustom({
      type: newType,
      label: newLabel.trim(),
      color: nextCustomColor(customCategories),
    })
    setNewLabel('')
  }

  return (
    <section className="space-y-4 rounded-xl bg-surface p-4">
      <h3 className="text-sm font-semibold">{t('settings.categories')}</h3>
      <p className="text-xs text-muted">{t('settings.categoriesHint')}</p>

      <div className="space-y-2">
        {builtins.map((cat) => {
          const ov = overrides.find((o) => o.key === cat.key)
          const label = ov?.label ?? t(`category.${cat.key}`)
          const hidden = !!ov?.hidden
          return (
            <div
              key={cat.key}
              className={`flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 ${
                hidden ? 'opacity-50' : ''
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: cat.color }}
              />
              {editingKey === cat.key ? (
                <input
                  className="min-h-[36px] flex-1 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{label}</p>
                  <p className="text-[10px] text-muted">
                    {cat.type === 'income' ? t('income') : t('expense')}
                    {hidden ? ` · ${t('settings.hidden')}` : ''}
                  </p>
                </div>
              )}
              {editingKey === cat.key ? (
                <Button variant="secondary" className="!min-h-[36px] !px-3" onClick={saveEdit}>
                  {t('save')}
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(cat.key, label)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-primary-light"
                    title={t('edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  {hidden ? (
                    <button
                      type="button"
                      onClick={() => restoreBuiltin(cat.key)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-income"
                      title={t('settings.restore')}
                    >
                      <RotateCcw size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('confirmDelete'))) hideBuiltin(cat.key)
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-expense"
                      title={t('delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}

        {customCategories.map((cat) => (
          <div
            key={cat.key}
            className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: cat.color }}
            />
            {editingKey === cat.key ? (
              <input
                className="min-h-[36px] flex-1 rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
              />
            ) : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{cat.label}</p>
                <p className="text-[10px] text-muted">
                  {cat.type === 'income' ? t('income') : t('expense')} · {t('settings.custom')}
                </p>
              </div>
            )}
            {editingKey === cat.key ? (
              <Button variant="secondary" className="!min-h-[36px] !px-3" onClick={saveEdit}>
                {t('save')}
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => startEdit(cat.key, cat.label)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-primary-light"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('confirmDelete'))) deleteCustom(cat.key)
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

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted">{t('settings.addCategory')}</p>
        <Select
          value={newType}
          onChange={(e) => setNewType(e.target.value as 'income' | 'expense')}
          options={[
            { value: 'expense', label: t('expense') },
            { value: 'income', label: t('income') },
          ]}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={t('settings.categoryName')}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd}>
            <Plus size={16} />
            {t('add')}
          </Button>
        </div>
      </div>
    </section>
  )
}
