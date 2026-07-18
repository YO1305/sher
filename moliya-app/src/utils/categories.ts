import {
  Banknote,
  Wallet,
  HandCoins,
  RotateCcw,
  CircleDollarSign,
  Home,
  House,
  Utensils,
  Bus,
  HeartPulse,
  Shirt,
  Phone,
  Droplets,
  ArrowUpRight,
  CreditCard,
  GraduationCap,
  Trash2,
  MoreHorizontal,
  Gift,
  Heart,
  type LucideIcon,
} from 'lucide-react'

export interface CategoryDef {
  key: string
  type: 'income' | 'expense'
  icon: LucideIcon
  color: string
  aliases: string[]
}

export const INCOME_CATEGORIES: CategoryDef[] = [
  {
    key: 'salary',
    type: 'income',
    icon: Banknote,
    color: '#22C55E',
    aliases: ['Ойлик маош', 'Ойлик', 'Maosh', 'Зарплата'],
  },
  {
    key: 'pocket',
    type: 'income',
    icon: Wallet,
    color: '#34D399',
    aliases: ['Карманный пул', 'Карман пул', "Cho'ntak puli"],
  },
  {
    key: 'loan_taken',
    type: 'income',
    icon: HandCoins,
    color: '#F59E0B',
    aliases: ['Карз олиш', 'Қарз олиш', 'Взятый займ'],
  },
  {
    key: 'loan_return',
    type: 'income',
    icon: RotateCcw,
    color: '#A78BFA',
    aliases: ['Карз кайтаришлари', 'Қарз қайтаришлари', 'Возврат долга'],
  },
  {
    key: 'savings_withdraw',
    type: 'income',
    icon: Wallet,
    color: '#14B8A6',
    aliases: ['Накопления снять', 'Jamgarmadan', 'С накоплений'],
  },
  {
    key: 'other_income',
    type: 'income',
    icon: CircleDollarSign,
    color: '#60A5FA',
    aliases: ['Бошка тушумлар', 'Бошқа тушумлар', 'Прочие доходы'],
  },
]

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  {
    key: 'rent',
    type: 'expense',
    icon: Home,
    color: '#F472B6',
    aliases: ['Уйга топшириш ойлик', 'Аренда'],
  },
  {
    key: 'home',
    type: 'expense',
    icon: House,
    color: '#FB923C',
    aliases: ['Уй учун', 'Расходы на дом'],
  },
  {
    key: 'food',
    type: 'expense',
    icon: Utensils,
    color: '#EF4444',
    aliases: ['Озик овкат', 'Озиқ овқат', 'Еда'],
  },
  {
    key: 'transport',
    type: 'expense',
    icon: Bus,
    color: '#38BDF8',
    aliases: ['Йулкира', "Yo'lkira", 'Транспорт'],
  },
  {
    key: 'health',
    type: 'expense',
    icon: HeartPulse,
    color: '#F87171',
    aliases: ['Соглик / дори дармон', 'Соғлиқ', 'Здоровье'],
  },
  {
    key: 'clothes',
    type: 'expense',
    icon: Shirt,
    color: '#C084FC',
    aliases: ['Кийим кечак', 'Одежда'],
  },
  {
    key: 'comms',
    type: 'expense',
    icon: Phone,
    color: '#818CF8',
    aliases: ['Связь телефон. Интернет', 'Связь', 'Aloqa'],
  },
  {
    key: 'utilities',
    type: 'expense',
    icon: Droplets,
    color: '#2DD4BF',
    aliases: ['Камунал (газ, сув, электр)', 'Коммунальные', 'Kommunal'],
  },
  {
    key: 'loan_given',
    type: 'expense',
    icon: ArrowUpRight,
    color: '#FBBF24',
    aliases: ['Карз бериш', 'Қарз бериш', 'Выданный займ'],
  },
  {
    key: 'loan_pay',
    type: 'expense',
    icon: HandCoins,
    color: '#F59E0B',
    aliases: ['Карз тулаш', 'Қарз тўлаш', 'Погашение займа'],
  },
  {
    key: 'credit_pay',
    type: 'expense',
    icon: CreditCard,
    color: '#EAB308',
    aliases: ['Кредит тулаш', 'Кредит тўлаш', 'Погашение кредита'],
  },
  {
    key: 'card_pay',
    type: 'expense',
    icon: CreditCard,
    color: '#F97316',
    aliases: ['Карта тулаш', 'Оплата карты', 'Karta to\'lash'],
  },
  {
    key: 'education',
    type: 'expense',
    icon: GraduationCap,
    color: '#6366F1',
    aliases: ['Таълим', "Ta'lim", 'Образование', 'Контракт'],
  },
  {
    key: 'waste',
    type: 'expense',
    icon: Trash2,
    color: '#94A3B8',
    aliases: ['Бехуда харажатлар', 'Бехуда харажат', 'Лишние'],
  },
  {
    key: 'other_expense',
    type: 'expense',
    icon: MoreHorizontal,
    color: '#64748B',
    aliases: ['Бошка харажатлар', 'Бошқа харажатлар', 'Прочие расходы'],
  },
  {
    key: 'family_gift',
    type: 'expense',
    icon: Gift,
    color: '#EC4899',
    aliases: ['Силаи рахм', 'Силаи раҳм', 'Подарки'],
  },
  {
    key: 'charity',
    type: 'expense',
    icon: Heart,
    color: '#F43F5E',
    aliases: ['Эхсон', 'Эҳсон', 'Пожертвование'],
  },
  {
    key: 'savings_deposit',
    type: 'expense',
    icon: Wallet,
    color: '#14B8A6',
    aliases: ['Накопления', 'Jamgarma', 'Отложить'],
  },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export function getCategory(key: string): CategoryDef | undefined {
  return ALL_CATEGORIES.find((c) => c.key === key)
}

export function getCategoriesByType(type: 'income' | 'expense'): CategoryDef[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

export function mapCategoryFromExcel(raw: string | undefined, type: 'income' | 'expense'): string {
  if (!raw) return type === 'income' ? 'other_income' : 'other_expense'
  const normalized = String(raw).trim().toLowerCase()
  const list = getCategoriesByType(type)
  for (const cat of list) {
    if (cat.aliases.some((a) => a.toLowerCase() === normalized || normalized.includes(a.toLowerCase()))) {
      return cat.key
    }
  }
  for (const cat of ALL_CATEGORIES) {
    if (cat.aliases.some((a) => a.toLowerCase() === normalized || normalized.includes(a.toLowerCase()))) {
      return cat.key
    }
  }
  return type === 'income' ? 'other_income' : 'other_expense'
}
