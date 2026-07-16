export function formatCurrency(amount: number, compact = false): string {
  const abs = Math.abs(Math.round(amount))
  if (compact && abs >= 1_000_000) {
    const mln = abs / 1_000_000
    const formatted = mln % 1 === 0 ? mln.toFixed(0) : mln.toFixed(1)
    return `${amount < 0 ? '-' : ''}${formatted} mln`
  }
  const formatted = new Intl.NumberFormat('uz-UZ', {
    maximumFractionDigits: 0,
  }).format(abs)
  return `${amount < 0 ? '-' : ''}${formatted}`
}

export function formatCurrencyFull(amount: number): string {
  return `${formatCurrency(amount)} so'm`
}
