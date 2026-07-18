import type { SmsRule } from './types'

export const BANKS_REGISTRY: Record<
  string,
  { name: string; senderIds: string[]; color: string }
> = {
  kapitalbank: {
    name: 'Kapitalbank',
    senderIds: ['Kapital24', 'KAPITALBANK', '1006'],
    color: '#E63946',
  },
  payme: {
    name: 'Payme',
    senderIds: ['PAYME', 'Payme'],
    color: '#00B4D8',
  },
  click: {
    name: 'Click',
    senderIds: ['CLICK', 'Click'],
    color: '#FFC300',
  },
  uzumbank: {
    name: 'Uzum Bank',
    senderIds: ['UZUMBANK', 'UzumBank', 'Uzum'],
    color: '#7B2FBE',
  },
  ipakyuli: {
    name: "Ipak Yo'li Bank",
    senderIds: ['IPAKYOLI', 'IpakYoli'],
    color: '#2ECC71',
  },
  xalqbank: {
    name: 'Xalq Banki',
    senderIds: ['XALQBANK', 'XalqBank'],
    color: '#1A73E8',
  },
  aloqabank: {
    name: 'Aloqabank',
    senderIds: ['ALOQABANK'],
    color: '#FF6B35',
  },
  tbc: {
    name: 'TBC',
    senderIds: ['TBC', 'TBCUZ'],
    color: '#00A651',
  },
  hamkorbank: {
    name: 'Hamkorbank',
    senderIds: ['HAMKORBANK', 'Hamkor'],
    color: '#E85D04',
  },
}

export const DEFAULT_SMS_RULES: SmsRule[] = [
  {
    id: 'kapital_debit',
    bankId: 'kapitalbank',
    senderId: 'Kapital24',
    pattern: String.raw`Karta\s*\*(\d{4}).*?(\d[\d\s]+)\s*UZS.*?(?:hisobdan|списано|chiqarildi)`,
    groups: { cardMask: 1, amount: 2, type: 'expense' },
    exampleSms: 'Karta *3976 dan 45 000 UZS hisobdan chiqarildi. Qoldiq: 1 200 000 UZS',
  },
  {
    id: 'kapital_credit',
    bankId: 'kapitalbank',
    senderId: 'Kapital24',
    pattern: String.raw`Karta\s*\*(\d{4}).*?(\d[\d\s]+)\s*UZS.*?(?:o'tkazildi|зачислено|kirim)`,
    groups: { cardMask: 1, amount: 2, type: 'income' },
    exampleSms: "Karta *3976 ga 3 392 000 UZS o'tkazildi. Qoldiq: 4 592 000 UZS",
  },
  {
    id: 'kapital_balance',
    bankId: 'kapitalbank',
    senderId: 'Kapital24',
    pattern: String.raw`[Qq]oldiq[:\s]+(\d[\d\s]+)\s*UZS`,
    groups: { balance: 1, type: 'expense' },
    exampleSms: 'Qoldiq: 1 200 000 UZS',
  },
  {
    id: 'payme_debit',
    bankId: 'payme',
    senderId: 'PAYME',
    pattern: String.raw`(\d[\d\s]+)\s*so['']m.*?(?:to'landi|списано|chiqarildi)`,
    groups: { amount: 1, type: 'expense' },
    exampleSms: "85 000 so'm to'landi. Qoldiq: 215 000 so'm",
  },
  {
    id: 'payme_credit',
    bankId: 'payme',
    senderId: 'PAYME',
    pattern: String.raw`(\d[\d\s]+)\s*so['']m.*?(?:qabul qilindi|зачислено|kirim)`,
    groups: { amount: 1, type: 'income' },
    exampleSms: "500 000 so'm qabul qilindi.",
  },
  {
    id: 'click_debit',
    bankId: 'click',
    senderId: 'CLICK',
    pattern: String.raw`(?:To'lov|Платёж)[:\s]+(\d[\d\s,]+)\s*(?:UZS|so'm)`,
    groups: { amount: 1, type: 'expense' },
    exampleSms: "To'lov: 30 000 UZS. Xizmat: Toshkent elektr tarmog'i",
  },
  {
    id: 'uzumbank_debit',
    bankId: 'uzumbank',
    senderId: 'UZUMBANK',
    pattern: String.raw`(\d[\d\s]+)\s*UZS.*?(?:debet|списан|chiqarildi).*?\*(\d{4})`,
    groups: { amount: 1, cardMask: 2, type: 'expense' },
    exampleSms: '120 000 UZS debet *8821. Qoldiq 580 000 UZS',
  },
  {
    id: 'ipakyoli_debit',
    bankId: 'ipakyuli',
    senderId: 'IPAKYOLI',
    pattern: String.raw`(\d[\d\s]+)\s*UZS.*?kartangizdan`,
    groups: { amount: 1, type: 'expense' },
    exampleSms: '56 000 UZS kartangizdan yechib olindi.',
  },
  {
    id: 'xalq_debit',
    bankId: 'xalqbank',
    senderId: 'XalqBank',
    pattern: String.raw`Xarajat[:\s]+(\d[\d\s]+)\s*so['']m.*?\*(\d{4})`,
    groups: { amount: 1, cardMask: 2, type: 'expense' },
    exampleSms: "Xarajat: 25 000 so'm. Karta *1234. Qoldiq: 750 000 so'm",
  },
]

/** Payee keyword → category key (UZ market). */
export const PAYEE_CATEGORY_MAP: Record<string, string> = {
  korzinka: 'food',
  makro: 'food',
  next: 'food',
  carrefour: 'food',
  havas: 'food',
  магнит: 'food',
  yandex: 'transport',
  яндекс: 'transport',
  uber: 'transport',
  'toshkent elektr': 'utilities',
  gas: 'utilities',
  suv: 'utilities',
  maktab: 'education',
  universitet: 'education',
  kontrakt: 'education',
  dori: 'health',
  apteka: 'health',
  klinika: 'health',
  shifoxona: 'health',
  ucell: 'comms',
  uzmobile: 'comms',
  beeline: 'comms',
  mobiuz: 'comms',
}
