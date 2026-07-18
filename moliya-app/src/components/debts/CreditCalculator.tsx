import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calculator } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import {
  calculateAnnuityCredit,
  type AnnuityCreditResult,
} from '../../utils/annuityCredit'
import { formatCurrency } from '../../utils/formatCurrency'

export interface CreditCalculatorApply {
  /** Remaining principal S_m → remainingAmount / totalAmount */
  remainingPrincipal: number
  /** Original principal S */
  principal: number
  /** Monthly payment A */
  monthlyPayment: number
  /** Remaining term n − m */
  remainingMonths: number
  /** Original term n */
  monthsTotal: number
  /** Paid months m */
  monthsPaid: number
  annualRate: number
}

interface Props {
  /** When set, "Apply" fills the parent credit form */
  onApply?: (data: CreditCalculatorApply) => void
  className?: string
}

export function CreditCalculator({ onApply, className = '' }: Props) {
  const { t } = useTranslation()
  const [principal, setPrincipal] = useState('')
  const [monthsTotal, setMonthsTotal] = useState('')
  const [monthsPaid, setMonthsPaid] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [touched, setTouched] = useState(false)

  const outcome = useMemo(() => {
    if (!touched && !principal && !monthsTotal) return null
    return calculateAnnuityCredit({
      principal: Number(principal.replace(/\s/g, '')) || 0,
      monthsTotal: Number(monthsTotal) || 0,
      monthsPaid: Number(monthsPaid) || 0,
      annualRate: Number(annualRate.replace(',', '.')) || 0,
    })
  }, [principal, monthsTotal, monthsPaid, annualRate, touched])

  const result: AnnuityCreditResult | null =
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
            {t('calc.result')}
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
            <span className="text-muted">{t('monthlyPayment')}</span>
            <span className="font-mono font-semibold text-amber-300">
              {formatCurrency(result.monthlyPayment)}
            </span>
          </div>
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
