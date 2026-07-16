import type { Transaction, Debt, Settings } from '../types'

export interface ExportPayload {
  version: 1
  exportedAt: string
  transactions: Transaction[]
  debts: Debt[]
  settings: Settings
}

export function exportToJson(data: Omit<ExportPayload, 'version' | 'exportedAt'>): void {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moliya-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromJson(file: File): Promise<ExportPayload> {
  const text = await file.text()
  const data = JSON.parse(text) as ExportPayload
  if (!Array.isArray(data.transactions) || !Array.isArray(data.debts) || !data.settings) {
    throw new Error('Invalid JSON format')
  }
  return data
}
