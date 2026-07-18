/** Credit schedule math for existing loans (part already paid). Amounts in whole UZS. */

export type CreditPaymentType = 'annuity' | 'differentiated'

export interface ExistingCreditInput {
  /** Original principal S */
  principal: number
  /** Total term in months n */
  monthsTotal: number
  /** Months already paid m */
  monthsPaid: number
  /** Annual interest rate in percent (e.g. 24) */
  annualRate: number
  /** Schedule model */
  paymentType: CreditPaymentType
}

export interface ExistingCreditResult {
  paymentType: CreditPaymentType
  /** Next monthly payment (annuity: fixed A; differentiated: next installment) */
  monthlyPayment: number
  /** Remaining principal after m payments S_m */
  remainingPrincipal: number
  /** n − m */
  remainingMonths: number
  /** Monthly rate r = (annualRate/100)/12 */
  monthlyRate: number
  /** Principal portion per month (differentiated only): S/n */
  principalPortion?: number
  /** Interest part of next payment (differentiated) */
  interestPortion?: number
  /** First payment amount (differentiated, for reference) */
  firstPayment?: number
  /** Last payment amount (differentiated, for reference) */
  lastPayment?: number
  principal: number
  monthsTotal: number
  monthsPaid: number
  annualRate: number
}

export interface ExistingCreditError {
  ok: false
  error: 'invalid_principal' | 'invalid_term' | 'invalid_paid' | 'invalid_rate'
}

export type ExistingCreditOutcome =
  | ({ ok: true } & ExistingCreditResult)
  | ExistingCreditError

export function monthlyRateFromAnnual(annualRate: number): number {
  return annualRate / 100 / 12
}

/** A = S * (r*(1+r)^n) / ((1+r)^n − 1) */
export function calcAnnuityPayment(
  principal: number,
  monthsTotal: number,
  monthlyRate: number,
): number {
  if (monthsTotal <= 0) return 0
  if (monthlyRate <= 0) return principal / monthsTotal
  const factor = Math.pow(1 + monthlyRate, monthsTotal)
  return (principal * (monthlyRate * factor)) / (factor - 1)
}

/** Annuity remaining principal after m payments */
export function calcAnnuityRemainingPrincipal(
  principal: number,
  monthsTotal: number,
  monthsPaid: number,
  monthlyRate: number,
): number {
  if (monthsTotal <= 0) return 0
  const remainingMonths = monthsTotal - monthsPaid
  if (remainingMonths <= 0) return 0
  if (monthsPaid <= 0) return principal
  if (monthlyRate <= 0) return (principal * remainingMonths) / monthsTotal
  const powN = Math.pow(1 + monthlyRate, monthsTotal)
  const powM = Math.pow(1 + monthlyRate, monthsPaid)
  return (principal * (powN - powM)) / (powN - 1)
}

/**
 * Differentiated: equal principal portions.
 * D = S / n
 * S_m = S − m*D = S*(n−m)/n
 * Payment in month k (1-based): D + (S − (k−1)*D)*r
 * Next payment after m paid months (month m+1): D + S_m * r
 */
export function calcDifferentiatedRemainingPrincipal(
  principal: number,
  monthsTotal: number,
  monthsPaid: number,
): number {
  if (monthsTotal <= 0) return 0
  const remainingMonths = monthsTotal - monthsPaid
  if (remainingMonths <= 0) return 0
  if (monthsPaid <= 0) return principal
  return (principal * remainingMonths) / monthsTotal
}

export function calcDifferentiatedPayment(
  principal: number,
  monthsTotal: number,
  monthsPaid: number,
  monthlyRate: number,
): { payment: number; principalPortion: number; interestPortion: number } {
  const principalPortion = monthsTotal > 0 ? principal / monthsTotal : 0
  const remaining = calcDifferentiatedRemainingPrincipal(
    principal,
    monthsTotal,
    monthsPaid,
  )
  const interestPortion = remaining * monthlyRate
  return {
    payment: principalPortion + interestPortion,
    principalPortion,
    interestPortion,
  }
}

function validateInput(input: ExistingCreditInput): ExistingCreditError | null {
  const S = Number(input.principal)
  const n = Math.round(Number(input.monthsTotal))
  const m = Math.round(Number(input.monthsPaid))
  const annualRate = Number(input.annualRate)

  if (!Number.isFinite(S) || S <= 0) return { ok: false, error: 'invalid_principal' }
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'invalid_term' }
  if (!Number.isFinite(m) || m < 0 || m >= n) return { ok: false, error: 'invalid_paid' }
  if (!Number.isFinite(annualRate) || annualRate < 0) return { ok: false, error: 'invalid_rate' }
  return null
}

/** Pure calculator for an existing credit (annuity or differentiated). */
export function calculateExistingCredit(
  input: ExistingCreditInput,
): ExistingCreditOutcome {
  const err = validateInput(input)
  if (err) return err

  const S = Number(input.principal)
  const n = Math.round(Number(input.monthsTotal))
  const m = Math.round(Number(input.monthsPaid))
  const annualRate = Number(input.annualRate)
  const r = monthlyRateFromAnnual(annualRate)
  const remainingMonths = n - m
  const paymentType = input.paymentType

  if (paymentType === 'differentiated') {
    const next = calcDifferentiatedPayment(S, n, m, r)
    const first = calcDifferentiatedPayment(S, n, 0, r)
    const last = calcDifferentiatedPayment(S, n, n - 1, r)
    const S_m = calcDifferentiatedRemainingPrincipal(S, n, m)

    return {
      ok: true,
      paymentType,
      monthlyPayment: Math.round(next.payment),
      remainingPrincipal: Math.round(S_m),
      remainingMonths,
      monthlyRate: r,
      principalPortion: Math.round(next.principalPortion),
      interestPortion: Math.round(next.interestPortion),
      firstPayment: Math.round(first.payment),
      lastPayment: Math.round(last.payment),
      principal: Math.round(S),
      monthsTotal: n,
      monthsPaid: m,
      annualRate,
    }
  }

  // annuity
  const A = calcAnnuityPayment(S, n, r)
  const S_m = calcAnnuityRemainingPrincipal(S, n, m, r)

  return {
    ok: true,
    paymentType: 'annuity',
    monthlyPayment: Math.round(A),
    remainingPrincipal: Math.round(S_m),
    remainingMonths,
    monthlyRate: r,
    principal: Math.round(S),
    monthsTotal: n,
    monthsPaid: m,
    annualRate,
  }
}

/** @deprecated use calculateExistingCredit */
export function calculateAnnuityCredit(
  input: Omit<ExistingCreditInput, 'paymentType'> & { paymentType?: CreditPaymentType },
): ExistingCreditOutcome {
  return calculateExistingCredit({
    ...input,
    paymentType: input.paymentType ?? 'annuity',
  })
}

/** @deprecated */
export type AnnuityCreditResult = ExistingCreditResult
export type AnnuityCreditInput = ExistingCreditInput
export type AnnuityCreditOutcome = ExistingCreditOutcome
export const calcRemainingPrincipal = calcAnnuityRemainingPrincipal
