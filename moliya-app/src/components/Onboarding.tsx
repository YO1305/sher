import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileSpreadsheet, Sparkles } from 'lucide-react'
import { Button } from './ui/Button'
import { useSettingsStore } from '../store/settingsStore'
import { useTransactionStore } from '../store/transactionStore'
import { parseExcelFile } from '../utils/excelImport'

export function Onboarding() {
  const { t } = useTranslation()
  const setOnboardingDone = useSettingsStore((s) => s.setOnboardingDone)
  const setTransactions = useTransactionStore((s) => s.setTransactions)
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImport = async (file: File) => {
    setLoading(true)
    setError('')
    try {
      const txs = await parseExcelFile(file)
      if (txs.length === 0) {
        setError('No transactions found')
        return
      }
      setTransactions(txs)
      setOnboardingDone(true)
    } catch {
      setError('Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary-light">
          <Sparkles size={32} />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight2">Moliya</h1>
        <p className="mb-1 text-lg font-semibold text-slate-100">{t('onboarding.title')}</p>
        <p className="mb-8 text-muted">{t('onboarding.subtitle')}</p>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet size={18} />
            {loading ? '...' : t('onboarding.import')}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => setOnboardingDone(true)}
          >
            {t('onboarding.skip')}
          </Button>
        </div>
        {error && <p className="mt-4 text-sm text-expense">{error}</p>}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
          }}
        />
      </div>
    </div>
  )
}
