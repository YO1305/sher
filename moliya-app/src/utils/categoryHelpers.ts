import type { TFunction } from 'i18next'
import {
  ALL_CATEGORIES,
  type CategoryDef,
  getCategory as getBuiltinCategory,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from './categories'
import type { CategoryOverride, CustomCategory } from '../types'
import { CircleDollarSign, MoreHorizontal, type LucideIcon } from 'lucide-react'

const CUSTOM_COLORS = [
  '#22C55E',
  '#EF4444',
  '#38BDF8',
  '#F59E0B',
  '#A78BFA',
  '#F472B6',
  '#2DD4BF',
  '#FB923C',
]

export function nextCustomColor(existing: CustomCategory[]): string {
  return CUSTOM_COLORS[existing.length % CUSTOM_COLORS.length]
}

export interface ResolvedCategory {
  key: string
  type: 'income' | 'expense'
  label: string
  color: string
  icon: LucideIcon
  isCustom: boolean
  isBuiltin: boolean
}

function overrideFor(key: string, overrides: CategoryOverride[]) {
  return overrides.find((o) => o.key === key)
}

export function getCategoryLabel(
  key: string,
  t: TFunction,
  overrides: CategoryOverride[] = [],
  custom: CustomCategory[] = [],
): string {
  const ov = overrideFor(key, overrides)
  if (ov?.label) return ov.label
  const c = custom.find((x) => x.key === key)
  if (c) return c.label
  const i18nKey = `category.${key}`
  const translated = t(i18nKey)
  if (translated !== i18nKey) return translated
  return key
}

export function resolveCategories(
  type: 'income' | 'expense',
  t: TFunction,
  overrides: CategoryOverride[] = [],
  custom: CustomCategory[] = [],
): ResolvedCategory[] {
  const builtins = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const result: ResolvedCategory[] = []

  for (const cat of builtins) {
    const ov = overrideFor(cat.key, overrides)
    if (ov?.hidden) continue
    result.push({
      key: cat.key,
      type: cat.type,
      label: ov?.label ?? t(`category.${cat.key}`),
      color: cat.color,
      icon: cat.icon,
      isCustom: false,
      isBuiltin: true,
    })
  }

  for (const c of custom.filter((x) => x.type === type)) {
    result.push({
      key: c.key,
      type: c.type,
      label: c.label,
      color: c.color,
      icon: type === 'income' ? CircleDollarSign : MoreHorizontal,
      isCustom: true,
      isBuiltin: false,
    })
  }

  return result
}

export function resolveCategory(
  key: string,
  t: TFunction,
  overrides: CategoryOverride[] = [],
  custom: CustomCategory[] = [],
): ResolvedCategory | undefined {
  const builtin = getBuiltinCategory(key)
  if (builtin) {
    const ov = overrideFor(key, overrides)
    if (ov?.hidden) return undefined
    return {
      key: builtin.key,
      type: builtin.type,
      label: ov?.label ?? t(`category.${key}`),
      color: builtin.color,
      icon: builtin.icon,
      isCustom: false,
      isBuiltin: true,
    }
  }
  const c = custom.find((x) => x.key === key)
  if (!c) return undefined
  return {
    key: c.key,
    type: c.type,
    label: c.label,
    color: c.color,
    icon: c.type === 'income' ? CircleDollarSign : MoreHorizontal,
    isCustom: true,
    isBuiltin: false,
  }
}

export function getAllResolvableKeys(
  overrides: CategoryOverride[] = [],
  custom: CustomCategory[] = [],
): CategoryDef[] {
  const hidden = new Set(overrides.filter((o) => o.hidden).map((o) => o.key))
  return [
    ...ALL_CATEGORIES.filter((c) => !hidden.has(c.key)),
    ...custom.map(
      (c): CategoryDef => ({
        key: c.key,
        type: c.type,
        icon: c.type === 'income' ? CircleDollarSign : MoreHorizontal,
        color: c.color,
        aliases: [c.label],
      }),
    ),
  ]
}

export function slugifyCategoryKey(label: string, type: 'income' | 'expense'): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_]/gu, '')
    .slice(0, 40)
  return `custom_${type}_${base || Date.now()}`
}
