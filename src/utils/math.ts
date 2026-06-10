import { Decimal } from 'decimal.js'

// 設定 decimal.js 的精度與捨入規則，採用財務常用的四捨五入 (ROUND_HALF_UP)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

/**
 * 將任意數值安全轉換為 Decimal 實例。若輸入無效則返回 0
 */
export function toDecimal(val: any): Decimal {
  if (val instanceof Decimal) return val
  if (val === undefined || val === null || val === '') return new Decimal(0)
  try {
    // 移除可能存在的千分位逗號
    if (typeof val === 'string') {
      val = val.replace(/,/g, '').trim()
    }
    return new Decimal(val)
  } catch {
    return new Decimal(0)
  }
}

/**
 * 高精度加法
 */
export function add(a: any, b: any): Decimal {
  return toDecimal(a).plus(toDecimal(b))
}

/**
 * 高精度減法
 */
export function sub(a: any, b: any): Decimal {
  return toDecimal(a).minus(toDecimal(b))
}

/**
 * 高精度乘法
 */
export function mul(a: any, b: any): Decimal {
  return toDecimal(a).times(toDecimal(b))
}

/**
 * 高精度除法，防禦除以 0 的錯誤
 */
export function div(a: any, b: any): Decimal {
  const decB = toDecimal(b)
  if (decB.isZero()) return new Decimal(0)
  return toDecimal(a).div(decB)
}
