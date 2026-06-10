import { Decimal } from 'decimal.js'
import { toDecimal, mul, div, add, sub } from './math'

export interface MortgageResult {
  termYears: number
  principalAndInterest: Decimal // 本息平均攤還每月繳款金額
  interestOnly: Decimal // 只還利息 (寬限期) 每月繳款金額
}

/**
 * 計算房貸每月繳款金額
 * 
 * 公式定義：
 * 1. 寬限期 (只還利息) = 貸款本金 * 月利率
 * 2. 本息平均攤還 = 貸款本金 * [月利率 * (1 + 月利率)^總月數] / [(1 + 月利率)^總月數 - 1]
 * 
 * @param loanAmount 貸款總金額 (元)
 * @param annualRatePercent 年利率 (如 2.1 代表 2.1%)
 * @param termYears 貸款年期 (如 20, 30, 40)
 */
export function calculateMortgage(
  loanAmount: any,
  annualRatePercent: any,
  termYears: number
): MortgageResult {
  const principal = toDecimal(loanAmount)
  const annualRate = div(toDecimal(annualRatePercent), 100) // 2.1% -> 0.021
  const monthlyRate = div(annualRate, 12) // 月利率 = 年利率 / 12
  const totalMonths = termYears * 12 // 總月數 = 年期 * 12

  // 1. 寬限期月付額 (只還利息) = 本金 * 月利率
  const interestOnly = mul(principal, monthlyRate)

  // 2. 本息平均攤還月付額
  let principalAndInterest = new Decimal(0)
  if (principal.gt(0)) {
    if (monthlyRate.isZero()) {
      principalAndInterest = div(principal, totalMonths)
    } else {
      const onePlusR = add(1, monthlyRate) // 1 + r
      const onePlusRPowN = onePlusR.pow(totalMonths) // (1 + r)^n
      const numerator = mul(monthlyRate, onePlusRPowN) // r * (1 + r)^n
      const denominator = sub(onePlusRPowN, 1) // (1 + r)^n - 1
      const pmtRatio = div(numerator, denominator)
      principalAndInterest = mul(principal, pmtRatio)
    }
  }

  return {
    termYears,
    principalAndInterest,
    interestOnly
  }
}

/**
 * 一併計算 20年、30年、40年的房貸負擔結果
 */
export function calculateMortgageTerms(loanAmount: any, annualRatePercent: any): MortgageResult[] {
  return [
    calculateMortgage(loanAmount, annualRatePercent, 20),
    calculateMortgage(loanAmount, annualRatePercent, 30),
    calculateMortgage(loanAmount, annualRatePercent, 40),
  ]
}
