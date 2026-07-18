/** Annuity credit math for existing loans (part already paid). Amounts in whole UZS. */

export interface AnnuityCreditInput {
  /** Original principal S */
  principal: number
  /** Total term in months n */
  monthsTotal: number
  /** Months already paid m */
  monthsPaid: number
  /** Annual interest rate in percent (e.g. 24) */
  annualRate: number
}

export interface AnnuityCreditResult {
  /** Monthly annuity payment A */
  monthlyPayment: number
  /** Remaining principal after m payments S_m */
  remainingPrincipal: number
  /** n − m */
  remainingMonths: number
  /** Monthly rate r = (annualRate/100)/12 */
  monthlyRate: number
  /** Original principal (rounded) */
  principal: number
  /** Total term n */
  monthsTotal: number
  /** Paid months m */
  monthsPaid: number
  /** Annual rate % */
  annualRate: number
}

export interface AnnuityCreditError {
  ok: false
  error: 'invalid_principal' | 'invalid_term' | 'invalid_paid' | 'invalid_rate'
}

export type AnnuityCreditOutcome =
  | ({ ok: true } & AnnuityCreditResult)
  | AnnuityCreditError

/**
 * Monthly rate from annual percent.
 * r = (annualRate / 100) / 12
 */
export function monthlyRateFromAnnual(annualRate: number): number {
  return annualRate / 100 / 12
}

/**
 * Annuity monthly payment:
 * A = S * (r * (1+r)^n) / ((1+r)^n − 1)
 * If r ≈ 0 → A = S / n
 */
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

/**
 * Remaining principal after m paid months:
 * S_m = S * ((1+r)^n − (1+r)^m) / ((1+r)^n − 1)
 * If r ≈ 0 → S_m = S * (n − m) / n
 */
export function calcRemainingPrincipal(
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

/** Pure calculator for an existing annuity credit. Rounds money to integers. */
export function calculateAnnuityCredit(input: AnnuityCreditInput): AnnuityCreditOutcome {
  const S = Number(input.principal)
  const n = Math.round(Number(input.monthsTotal))
  const m = Math.round(Number(input.monthsPaid))
  const annualRate = Number(input.annualRate)

  if (!Number.isFinite(S) || S <= 0) return { ok: false, error: 'invalid_principal' }
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'invalid_term' }
  if (!Number.isFinite(m) || m < 0 || m >= n) return { ok: false, error: 'invalid_paid' }
  if (!Number.isFinite(annualRate) || annualRate < 0) return { ok: false, error: 'invalid_rate' }

  const r = monthlyRateFromAnnual(annualRate)
  const A = calcAnnuityPayment(S, n, r)
  const S_m = calcRemainingPrincipal(S, n, m, r)
  const remainingMonths = n - m

  return {
    ok: true,
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
