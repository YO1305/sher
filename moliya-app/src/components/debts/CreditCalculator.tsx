import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calculator } from 'lucide-react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import {
  calculateExistingCredit,
  type CreditPaymentType,
  type ExistingCreditResult,
} from '../../utils/annuityCredit'
import { formatCurrency } from '../../utils/formatCurrency'

export interface CreditCalculatorApply {
  remainingPrincipal: number
  principal: number
  monthlyPayment: number
  remainingMonths: number
  monthsTotal: number
  monthsPaid: number
  annualRate: number
  paymentType: CreditPaymentType
}

interface Props {
  onApply?: (data: CreditCalculatorApply) => void
  className?: string
  /** Controlled payment type (optional) */
  paymentType?: CreditPaymentType
  onPaymentTypeChange?: (type: CreditPaymentType) => void
}

export function CreditCalculator({
  onApply,
  className = '',
  paymentType: controlledType,
  onPaymentTypeChange,
}: Props) {
  const { t } = useTranslation()
  const [internalType, setInternalType] = useState<CreditPaymentType>('annuity')
  const paymentType = controlledType ?? internalType

  const setPaymentType = (next: CreditPaymentType) => {
    setInternalType(next)
    onPaymentTypeChange?.(next)
  }

  const [principal, setPrincipal] = useState('')
  const [monthsTotal, setMonthsTotal] = useState('')
  const [monthsPaid, setMonthsPaid] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [touched, setTouched] = useState(false)

  const outcome = useMemo(() => {
    if (!touched && !principal && !monthsTotal) return null
    return calculateExistingCredit({
      principal: Number(principal.replace(/\s/g, '')) || 0,
      monthsTotal: Number(monthsTotal) || 0,
      monthsPaid: Number(monthsPaid) || 0,
      annualRate: Number(annualRate.replace(',', '.')) || 0,
      paymentType,
    })
  }, [principal, monthsTotal, monthsPaid, annualRate, paymentType, touched])

  const result: ExistingCreditResult | null =
    outcome && outcome.ok ? outcome : null

  const errorKey =
    outcome && !outcome.ok
      ? ({
          invalid_principal: 'calc.errorPrincipal',
          invalid_term: 'calc.errorTerm',
          invalid_paid: 'calc.errorPaid',
          invalid_rate: 'calc.errorRate',
        }[outcome.error] as string)
      : null

  const handleApply = () => {
    if (!result || !onApply) return
    onApply({
      remainingPrincipal: result.remainingPrincipal,
      principal: result.principal,
      monthlyPayment: result.monthlyPayment,
      remainingMonths: result.remainingMonths,
      monthsTotal: result.monthsTotal,
      monthsPaid: result.monthsPaid,
      annualRate: result.annualRate,
      paymentType: result.paymentType,
    })
  }

  return (
    <div
      className={`space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
        <Calculator size={16} />
        {t('calc.title')}
      </div>
      <p className="text-[11px] text-muted">{t('calc.hint')}</p>

      <Select
        label={t('calc.paymentType')}
        value={paymentType}
        onChange={(e) => {
          setTouched(true)
          setPaymentType(e.target.value as CreditPaymentType)
        }}
        options={[
          { value: 'annuity', label: t('calc.annuity') },
          { value: 'differentiated', label: t('calc.differentiated') },
        ]}
      />
      <p className="text-[10px] text-muted">
        {paymentType === 'annuity' ? t('calc.annuityHint') : t('calc.differentiatedHint')}
      </p>

      <Input
        label={t('calc.principal')}
        inputMode="numeric"
        value={principal}
        onChange={(e) => {
          setTouched(true)
          setPrincipal(e.target.value.replace(/[^\d]/g, ''))
        }}
        placeholder="100000000"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          label={t('calc.monthsTotal')}
          inputMode="numeric"
          value={monthsTotal}
          onChange={(e) => {
            setTouched(true)
            setMonthsTotal(e.target.value.replace(/[^\d]/g, ''))
          }}
          placeholder="30"
        />
        <Input
          label={t('calc.monthsPaid')}
          inputMode="numeric"
          value={monthsPaid}
          onChange={(e) => {
            setTouched(true)
            setMonthsPaid(e.target.value.replace(/[^\d]/g, ''))
          }}
          placeholder="14"
        />
      </div>
      <Input
        label={t('calc.annualRate')}
        inputMode="decimal"
        value={annualRate}
        onChange={(e) => {
          setTouched(true)
          setAnnualRate(e.target.value.replace(/[^\d.,]/g, ''))
        }}
        placeholder="24"
      />

      {errorKey && touched && (
        <p className="text-xs text-expense">{t(errorKey)}</p>
      )}

      {result && (
        <div className="space-y-2 rounded-lg border border-border bg-surface/80 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">
            {t('calc.result')} ·{' '}
            {result.paymentType === 'annuity'
              ? t('calc.annuity')
              : t('calc.differentiated')}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted">{t('calc.remainingPrincipal')}</span>
            <span className="font-mono text-lg font-bold text-gold">
              {formatCurrency(result.remainingPrincipal)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted">{t('calc.remainingMonths')}</span>
            <span className="font-mono font-semibold">
              {result.remainingMonths} {t('calc.monthsShort')}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted">
              {result.paymentType === 'differentiated'
                ? t('calc.nextPayment')
                : t('monthlyPayment')}
            </span>
            <span className="font-mono font-semibold text-amber-300">
              {formatCurrency(result.monthlyPayment)}
            </span>
          </div>
          {result.paymentType === 'differentiated' &&
            result.firstPayment != null &&
            result.lastPayment != null && (
              <p className="text-[10px] text-muted">
                {t('calc.diffRange', {
                  first: formatCurrency(result.firstPayment),
                  last: formatCurrency(result.lastPayment),
                })}
              </p>
            )}
          {onApply && (
            <Button className="mt-1 w-full" variant="secondary" onClick={handleApply}>
              {t('calc.apply')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
