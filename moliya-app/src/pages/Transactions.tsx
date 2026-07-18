import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare } from 'lucide-react'
import { TransactionList } from '../components/transactions/TransactionList'
import { SmsInput } from '../components/sms/SmsInput'
import { PendingList } from '../components/sms/PendingList'
import { Button } from '../components/ui/Button'

export function Transactions() {
  const { t } = useTranslation()
  const [smsOpen, setSmsOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight2">{t('nav.transactions')}</h2>
        <Button size="sm" variant="secondary" onClick={() => setSmsOpen(true)}>
          <MessageSquare size={16} />
          {t('sms.pasteBtn')}
        </Button>
      </div>
      <PendingList />
      <TransactionList />
      <SmsInput open={smsOpen} onClose={() => setSmsOpen(false)} />
    </div>
  )
}
