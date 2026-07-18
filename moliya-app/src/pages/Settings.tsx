import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload, FileSpreadsheet, Trash2, Cloud, LogOut } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CategorySettings } from '../components/settings/CategorySettings'
import { CreditCardSettings } from '../components/settings/CreditCardSettings'
import { useSettingsStore } from '../store/settingsStore'
import { useTransactionStore } from '../store/transactionStore'
import { useDebtStore } from '../store/debtStore'
import { useAuthStore } from '../store/authStore'
import { isFirebaseConfigured } from '../firebase/config'
import { exportToJson, importFromJson } from '../utils/exportImport'
import { parseExcelFile } from '../utils/excelImport'
import { DEFAULT_CREDIT_CARDS } from '../types'

export function Settings() {
  const { t, i18n } = useTranslation()
  const settings = useSettingsStore()
  const transactions = useTransactionStore((s) => s.transactions)
  const setTransactions = useTransactionStore((s) => s.setTransactions)
  const clearTransactions = useTransactionStore((s) => s.clearTransactions)
  const debts = useDebtStore((s) => s.debts)
  const setDebts = useDebtStore((s) => s.setDebts)
  const clearDebts = useDebtStore((s) => s.clearDebts)
  const authUser = useAuthStore((s) => s.user)
  const syncing = useAuthStore((s) => s.syncing)
  const authError = useAuthStore((s) => s.error)
  const signIn = useAuthStore((s) => s.signIn)
  const signOut = useAuthStore((s) => s.signOut)

  const jsonRef = useRef<HTMLInputElement>(null)
  const excelRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [initialBalance, setInitialBalance] = useState(String(settings.initialBalance || ''))

  const showMsg = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  const handleExport = () => {
    exportToJson({
      transactions,
      debts,
      settings: {
        userName: settings.userName,
        language: settings.language,
        initialBalance: settings.initialBalance,
        currency: settings.currency,
        onboardingDone: settings.onboardingDone,
        creditCards: settings.creditCards,
        customCategories: settings.customCategories,
        categoryOverrides: settings.categoryOverrides,
      },
    })
    showMsg(t('settings.exported'))
  }

  const handleJsonImport = async (file: File) => {
    try {
      const data = await importFromJson(file)
      setTransactions(data.transactions)
      setDebts(data.debts)
      settings.setSettings({
        ...data.settings,
        creditCards: data.settings.creditCards?.length
          ? data.settings.creditCards
          : DEFAULT_CREDIT_CARDS,
        customCategories: data.settings.customCategories ?? [],
        categoryOverrides: data.settings.categoryOverrides ?? [],
      })
      showMsg(t('settings.imported'))
    } catch {
      showMsg('Import error')
    }
  }

  const handleExcelImport = async (file: File) => {
    try {
      const txs = await parseExcelFile(file)
      setTransactions(txs)
      showMsg(`${t('settings.imported')}: ${txs.length}`)
    } catch {
      showMsg('Excel import error')
    }
  }

  const handleClear = () => {
    if (!confirm(t('settings.clearConfirm'))) return
    clearTransactions()
    clearDebts()
    settings.resetSettings()
    settings.setOnboardingDone(true)
    showMsg(t('settings.cleared'))
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-xl font-bold tracking-tight2">{t('settings.title')}</h2>

      {message && (
        <div className="rounded-xl bg-primary/15 px-4 py-3 text-sm text-primary-light">{message}</div>
      )}

      <section className="space-y-3 rounded-xl bg-surface p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Cloud size={16} className="text-primary-light" />
          {t('sync.title')}
        </div>
        {!isFirebaseConfigured ? (
          <p className="text-sm text-muted">{t('sync.notConfigured')}</p>
        ) : authUser ? (
          <div className="space-y-3">
            <p className="text-sm">
              {t('sync.signedInAs')}:{' '}
              <span className="font-semibold">{authUser.displayName || authUser.email}</span>
            </p>
            <p className="text-sm text-muted">
              {syncing ? t('sync.syncing') : t('sync.active')}
            </p>
            <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
              <LogOut size={16} />
              {t('sync.signOut')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t('sync.hint')}</p>
            <Button className="w-full" onClick={() => void signIn()}>
              {t('sync.signIn')}
            </Button>
            {authError && <p className="text-sm text-expense">{authError}</p>}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-surface p-4">
        <Input
          label={t('settings.userName')}
          value={settings.userName}
          onChange={(e) => settings.setUserName(e.target.value)}
        />

        <div>
          <p className="mb-1.5 text-sm text-muted">{t('settings.language')}</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface2 p-1">
            {(['uz', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  settings.setLanguage(lang)
                  void i18n.changeLanguage(lang)
                }}
                className={`min-h-[44px] rounded-lg text-sm font-semibold ${
                  settings.language === lang ? 'bg-primary text-white' : 'text-muted'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label={t('settings.initialBalance')}
              inputMode="numeric"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value.replace(/[^\d-]/g, ''))}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => settings.setInitialBalance(Math.round(Number(initialBalance) || 0))}
          >
            {t('save')}
          </Button>
        </div>
      </section>

      <CreditCardSettings />
      <CategorySettings />

      <section className="space-y-3 rounded-xl bg-surface p-4">
        <Button variant="secondary" className="w-full" onClick={handleExport}>
          <Download size={16} />
          {t('settings.export')}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => jsonRef.current?.click()}>
          <Upload size={16} />
          {t('settings.import')}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => excelRef.current?.click()}>
          <FileSpreadsheet size={16} />
          {t('settings.importExcel')}
        </Button>
        <Button variant="danger" className="w-full" onClick={handleClear}>
          <Trash2 size={16} />
          {t('settings.clear')}
        </Button>
        <input
          ref={jsonRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleJsonImport(file)
            e.target.value = ''
          }}
        />
        <input
          ref={excelRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleExcelImport(file)
            e.target.value = ''
          }}
        />
      </section>
    </div>
  )
}
