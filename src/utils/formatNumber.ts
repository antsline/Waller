export function formatNumber(value: number): string {
  if (value < 0) return '0'
  if (value < 1000) return String(Math.floor(value))
  if (value < 10000) {
    const k = value / 1000
    return k % 1 === 0 ? `${Math.floor(k)}k` : `${k.toFixed(1)}k`
  }
  if (value < 1000000) return `${Math.floor(value / 1000)}k`
  const m = value / 1000000
  return m % 1 === 0 ? `${Math.floor(m)}M` : `${m.toFixed(1)}M`
}
