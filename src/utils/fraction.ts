import { Decimal } from 'decimal.js'
import { toDecimal, div } from './math'

/**
 * 解析比例字串，支援分數 (如 1/3)、百分比 (如 20%) 與小數 (如 0.25)
 * 安全解析，嚴禁使用 eval() 以防止安全風險。
 */
export function parseRatioStr(ratioStr: string): Decimal {
  if (!ratioStr) return new Decimal(0)
  const trimmed = ratioStr.trim()

  // 1. 百分比格式: 例如 "20%" 或 "2.5%"
  if (trimmed.endsWith('%')) {
    const numPart = trimmed.slice(0, -1).trim()
    return div(toDecimal(numPart), 100)
  }

  // 2. 分數格式: 例如 "1/3" 或 "2/5"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    if (parts.length === 2) {
      const numerator = toDecimal(parts[0].trim())
      const denominator = toDecimal(parts[1].trim())
      return div(numerator, denominator)
    }
    return new Decimal(0)
  }

  // 3. 一般小數/整數格式
  return toDecimal(trimmed)
}

/**
 * 將 Decimal 比例格式化為可讀的百分比顯示 (例如 0.3333 -> "33.33%")
 */
export function formatRatioAsPercent(val: Decimal | number, decimals: number = 2): string {
  const dec = toDecimal(val)
  return dec.times(100).toFixed(decimals) + '%'
}
