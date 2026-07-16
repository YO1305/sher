import * as XLSX from 'xlsx'
import type { Transaction } from '../types'
import { mapCategoryFromExcel } from './categories'

function excelDateToISO(serial: number | string | Date): string {
  if (serial instanceof Date) {
    return serial.toISOString().split('T')[0]
  }
  if (typeof serial === 'string') {
    const parsed = new Date(serial)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  }
  const date = new Date((serial - 25569) * 86400 * 1000)
  return date.toISOString().split('T')[0]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Math.round(value)
  if (typeof value === 'string') {
    const n = Number(value.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(n) ? Math.round(n) : 0
  }
  return 0
}

function findTransactionsSheet(wb: XLSX.WorkBook): XLSX.WorkSheet {
  const names = wb.SheetNames
  const preferred =
    names.find((n) => /\d{2}\.\d{2}/.test(n)) ||
    names.find((n) => /кирим|чиким|kirim|chiqim/i.test(n)) ||
    names[1] ||
    names[0]
  return wb.Sheets[preferred]
}

export async function parseExcelFile(file: File): Promise<Transaction[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = findTransactionsSheet(wb)
  const rows = XLSX.utils.sheet_to_json<(string | number | Date | undefined)[]>(ws, {
    header: 1,
    defval: '',
  })

  const transactions: Transaction[] = []

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue

    const income = toNumber(row[5])
    const expense = toNumber(row[6])
    if (!income && !expense) continue

    // Skip header-like rows
    const first = String(row[0] ?? '').toLowerCase()
    if (first.includes('№') || first === 'n' || first === 'no') continue

    const type = income > 0 ? 'income' : 'expense'
    const amount = income > 0 ? income : expense
    const categoryRaw = String(row[4] ?? '')
    const dateRaw = row[1]

    if (dateRaw === '' || dateRaw === undefined || dateRaw === null) continue

    transactions.push({
      id: crypto.randomUUID(),
      date: excelDateToISO(dateRaw as number | string | Date),
      type,
      amount,
      category: mapCategoryFromExcel(categoryRaw, type),
      counterparty: String(row[2] ?? '').trim() || undefined,
      description: String(row[3] ?? '').trim() || undefined,
      createdAt: new Date().toISOString(),
    })
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
}
