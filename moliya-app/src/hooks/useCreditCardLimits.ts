import { useMemo } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useAccountStore } from '../store/accountStore'
import { useTransactionStore } from '../store/transactionStore'
import { getCreditCardLimits } from '../utils/creditCardLimits'

export function useCreditCardLimits() {
  const creditCards = useSettingsStore((s) => s.creditCards)
  const banks = useSettingsStore((s) => s.banks)
  const accounts = useAccountStore((s) => s.accounts)
  const transactions = useTransactionStore((s) => s.transactions)

  return useMemo(
    () => getCreditCardLimits(creditCards, accounts, transactions, banks),
    [creditCards, accounts, transactions, banks],
  )
}
