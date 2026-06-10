import { describe, it, expect } from 'vitest'
import { add, sub, mul, div, toDecimal } from '../src/utils/math'
import { parseRatioStr, formatRatioAsPercent } from '../src/utils/fraction'
import { calculateMortgage } from '../src/utils/mortgage'
import { Decimal } from 'decimal.js'

describe('Math Utilities', () => {
  it('should handle addition without JS float errors', () => {
    // JS 原生 0.1 + 0.2 === 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3)
    // 我們的 Decimal add
    expect(add(0.1, 0.2).toNumber()).toBe(0.3)
  })

  it('should handle division safely', () => {
    expect(div(10, 0).toNumber()).toBe(0) // 除以 0 防禦
    expect(div(1, 3).toFixed(4)).toBe('0.3333')
  })
})

describe('Fraction Utilities', () => {
  it('should parse percentage strings', () => {
    expect(parseRatioStr('20%').toNumber()).toBe(0.2)
    expect(parseRatioStr('2.5%').toNumber()).toBe(0.025)
  })

  it('should parse fraction strings', () => {
    expect(parseRatioStr('1/3').toFixed(4)).toBe('0.3333')
    expect(parseRatioStr('2/5').toNumber()).toBe(0.4)
    expect(parseRatioStr('1/0').toNumber()).toBe(0) // 除以 0 防禦
  })

  it('should parse decimal and integer strings', () => {
    expect(parseRatioStr('0.25').toNumber()).toBe(0.25)
    expect(parseRatioStr('1.5').toNumber()).toBe(1.5)
    expect(parseRatioStr('   3  ').toNumber()).toBe(3)
  })

  it('should parse invalid input to 0', () => {
    expect(parseRatioStr('invalid').toNumber()).toBe(0)
    expect(parseRatioStr('').toNumber()).toBe(0)
  })

  it('should format ratio as percentage string', () => {
    expect(formatRatioAsPercent(0.25)).toBe('25.00%')
    expect(formatRatioAsPercent(new Decimal('1').div(3), 2)).toBe('33.33%')
  })
})

describe('Mortgage Utilities', () => {
  it('should calculate mortgage payments accurately', () => {
    // 試算條件：貸款 1000 萬，年利率 2.1%，30 年期
    const result = calculateMortgage(10000000, 2.1, 30)

    // 本息攤還月繳：公式計算應約為 37,464 元
    expect(result.principalAndInterest.round().toNumber()).toBe(37464)

    // 寬限期月繳：1000萬 * (2.1% / 12) = 17,500 元
    expect(result.interestOnly.toNumber()).toBe(17500)
  })

  it('should handle 0 loan amount or rate safely', () => {
    const zeroLoan = calculateMortgage(0, 2.1, 20)
    expect(zeroLoan.principalAndInterest.toNumber()).toBe(0)
    expect(zeroLoan.interestOnly.toNumber()).toBe(0)

    const zeroRate = calculateMortgage(1200000, 0, 20) // 120萬 20年免息 -> 每月攤還 5000 元
    expect(zeroRate.principalAndInterest.toNumber()).toBe(5000)
    expect(zeroRate.interestOnly.toNumber()).toBe(0)
  })
})
