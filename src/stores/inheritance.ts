import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parseRatioStr } from '../utils/fraction'
import { add, sub, mul } from '../utils/math'
import { Decimal } from 'decimal.js'

export interface CashItem {
  id: string
  name: string
  amount: number
}

export interface RealEstateItem {
  id: string
  name: string
  value: number // 房產現值
  mortgage: number // 剩餘房貸
  rate: number // 房貸利率 (%)
}

export interface CommonExpenseItem {
  id: string
  name: string
  amount: number
  paidByHeirId?: string // 預先支付者的繼承人 ID，空字串或 undefined 表示由所有人共同按份支付（從總淨值扣除）
}

export interface HeirItem {
  id: string
  name: string
  targetShareStr: string // 目標繼承份數/比例，例如 "1/3", "50%"
}

// 格式為: { [assetId: string]: { [heirId: string]: string } }
export type AllocationMap = Record<string, Record<string, string>>

export const useInheritanceStore = defineStore(
  'inheritance',
  () => {
    // --- 狀態定義與預設測試數據 ---
    const cashList = ref<CashItem[]>([
      { id: 'cash_1', name: '銀行存款 - 活期台幣', amount: 5000000 },
      { id: 'cash_2', name: '證券戶 - 股票市值', amount: 3000000 },
    ])

    const realEstateList = ref<RealEstateItem[]>([
      { id: 're_1', name: '台北大安區電梯大樓', value: 30000000, mortgage: 8000000, rate: 2.1 },
      { id: 're_2', name: '新北板橋區公寓', value: 15000000, mortgage: 2000000, rate: 2.25 },
    ])

    const commonExpenseList = ref<CommonExpenseItem[]>([
      { id: 'exp_1', name: '預估遺產稅', amount: 1500000, paidByHeirId: 'heir_1' },
      { id: 'exp_2', name: '喪葬與相關儀式費用', amount: 500000, paidByHeirId: '' },
    ])

    const heirList = ref<HeirItem[]>([
      { id: 'heir_1', name: '長子 小明', targetShareStr: '1/3' },
      { id: 'heir_2', name: '次子 小華', targetShareStr: '1/3' },
      { id: 'heir_3', name: '長女 小美', targetShareStr: '1/3' },
    ])

    // 分配比例地圖 (預設分配)
    const allocations = ref<AllocationMap>({
      cash_1: { heir_1: '1/3', heir_2: '1/3', heir_3: '1/3' },
      cash_2: { heir_1: '1/3', heir_2: '1/3', heir_3: '1/3' },
      re_1: { heir_1: '1/2', heir_3: '1/2' }, // 長子與長女各持有一半
      re_2: { heir_2: '1' }, // 次子單獨持有一棟
    })

    // --- 計算屬性 (Getters) ---
    const totalCash = computed(() => {
      return cashList.value.reduce((sum, item) => add(sum, item.amount), new Decimal(0))
    })

    const totalRealEstateValue = computed(() => {
      return realEstateList.value.reduce((sum, item) => add(sum, item.value), new Decimal(0))
    })

    const totalRealEstateMortgage = computed(() => {
      return realEstateList.value.reduce((sum, item) => add(sum, item.mortgage), new Decimal(0))
    })

    // 總資產價值 = Σ(現金) + Σ(房產現值)
    const totalAssets = computed(() => add(totalCash.value, totalRealEstateValue.value))

    // 總負債價值 = Σ(房產貸款)
    const totalLiabilities = computed(() => totalRealEstateMortgage.value)

    // 總共同支出 = Σ(遺產稅、喪葬費等各項共同支出金額)
    const totalCommonExpenses = computed(() => {
      return commonExpenseList.value.reduce((sum, item) => add(sum, item.amount), new Decimal(0))
    })

    // 可分配總淨值 = 總資產價值 - 總負債價值 - 總共同支出
    // 注意：無論是否有預付者，共同支出都先從總淨值中扣除，再透過補償差額還給預付者
    const netDistributableValue = computed(() => {
      return sub(sub(totalAssets.value, totalLiabilities.value), totalCommonExpenses.value)
    })

    // 計算每位繼承人的共同支出補償情況
    // 對於每筆有指定預付者的支出：
    //   - 預付者：支付了全額，但只需負擔 amount * 自己targetRatio，可向其他人追討差額
    //     → 在差額計算中加入 amount * (1 - 自己targetRatio) 作為可收取的補償
    //   - 其他繼承人：需向預付者補償 amount * 自己targetRatio
    //     → 在差額計算中減去 amount * 自己targetRatio 作為應付的補償
    // 對於沒有指定預付者的支出：已從可分配總淨值中扣除，不需要額外的個人調整
    const heirExpenseAdjustments = computed(() => {
      const adjustments: Record<string, Decimal> = {}
      heirList.value.forEach((heir) => {
        adjustments[heir.id] = new Decimal(0)
      })

      commonExpenseList.value.forEach((expense) => {
        if (!expense.paidByHeirId) return // 無預付者，已從總淨值扣除，不需個人調整
        const payer = heirList.value.find((h) => h.id === expense.paidByHeirId)
        if (!payer) return

        const totalAmount = new Decimal(expense.amount)
        const payerRatio = parseRatioStr(payer.targetShareStr)
        // 預付者可收回金額 = 總支出 × (1 - 自己的份額比例)
        const payerReimbursement = mul(totalAmount, sub(new Decimal(1), payerRatio))
        adjustments[payer.id] = add(adjustments[payer.id], payerReimbursement)

        // 其他繼承人需補償的金額 = 總支出 × 自己的份額比例
        heirList.value.forEach((heir) => {
          if (heir.id === expense.paidByHeirId) return
          const heirRatio = parseRatioStr(heir.targetShareStr)
          const heirShare = mul(totalAmount, heirRatio)
          adjustments[heir.id] = sub(adjustments[heir.id], heirShare)
        })
      })

      return adjustments
    })

    // 計算每位繼承人的逐項共同支出明細（用於顯示）
    const heirExpenseDetails = computed(() => {
      const details: Record<string, Array<{ expenseId: string; name: string; amount: Decimal; isPayer: boolean; adjustment: Decimal }>> = {}
      heirList.value.forEach((heir) => {
        details[heir.id] = []
      })

      commonExpenseList.value.forEach((expense) => {
        const totalAmount = new Decimal(expense.amount)
        heirList.value.forEach((heir) => {
          const heirRatio = parseRatioStr(heir.targetShareStr)
          const ownShare = mul(totalAmount, heirRatio)
          const isPayer = expense.paidByHeirId === heir.id
          let adjustment = new Decimal(0)
          if (expense.paidByHeirId) {
            if (isPayer) {
              // 預付者：可收回其他人的份額
              adjustment = mul(totalAmount, sub(new Decimal(1), heirRatio))
            } else {
              // 其他人：需補償給預付者
              adjustment = ownShare.negated()
            }
          }
          details[heir.id].push({
            expenseId: expense.id,
            name: expense.name,
            amount: ownShare,
            isPayer,
            adjustment,
          })
        })
      })

      return details
    })

    // 單項資產分配進度與防呆
    const itemAllocationStatus = computed(() => {
      const status: Record<string, { allocated: Decimal; remaining: Decimal; isOver: boolean }> = {}

      // 現金分配
      cashList.value.forEach((cash) => {
        const allocs = allocations.value[cash.id] || {}
        let totalAllocated = new Decimal(0)
        Object.values(allocs).forEach((ratioStr) => {
          totalAllocated = add(totalAllocated, parseRatioStr(ratioStr))
        })
        status[cash.id] = {
          allocated: totalAllocated,
          remaining: sub(1, totalAllocated),
          isOver: totalAllocated.gt(1),
        }
      })

      // 房產分配
      realEstateList.value.forEach((re) => {
        const allocs = allocations.value[re.id] || {}
        let totalAllocated = new Decimal(0)
        Object.values(allocs).forEach((ratioStr) => {
          totalAllocated = add(totalAllocated, parseRatioStr(ratioStr))
        })
        status[re.id] = {
          allocated: totalAllocated,
          remaining: sub(1, totalAllocated),
          isOver: totalAllocated.gt(1),
        }
      })

      return status
    })

    // 繼承人計算面板數據
    const heirsResults = computed(() => {
      return heirList.value.map((heir) => {
        const targetRatio = parseRatioStr(heir.targetShareStr)
        // 繼承人預期淨值 = 可分配總淨值 * 目標份數比例
        const expectedNetValue = mul(netDistributableValue.value, targetRatio)

        let actualAssets = new Decimal(0)
        let actualLiabilities = new Decimal(0)
        const inheritedProperties: Array<{
          id: string
          name: string
          allocatedRatio: Decimal
          value: Decimal
          mortgage: Decimal
          rate: number
        }> = []

        // 繼承人實際取得資產 = Σ(分得之現金) + Σ(分得之房產現值)
        cashList.value.forEach((cash) => {
          const ratioStr = allocations.value[cash.id]?.[heir.id] || '0'
          const ratio = parseRatioStr(ratioStr)
          if (ratio.gt(0)) {
            actualAssets = add(actualAssets, mul(cash.amount, ratio))
          }
        })

        // 繼承人實際承接債務 = Σ(分得之房產貸款)
        realEstateList.value.forEach((re) => {
          const ratioStr = allocations.value[re.id]?.[heir.id] || '0'
          const ratio = parseRatioStr(ratioStr)
          if (ratio.gt(0)) {
            const val = mul(re.value, ratio)
            const mort = mul(re.mortgage, ratio)
            actualAssets = add(actualAssets, val)
            actualLiabilities = add(actualLiabilities, mort)

            inheritedProperties.push({
              id: re.id,
              name: re.name,
              allocatedRatio: ratio,
              value: val,
              mortgage: mort,
              rate: re.rate,
            })
          }
        })

        // 繼承人實際淨值 = 實際取得資產 - 實際承接債務
        const actualNetValue = sub(actualAssets, actualLiabilities)

        // 共同支出預付補償調整額
        // 正值：預付者可收回的金額（增加實際淨值）
        // 負值：需付給預付者的金額（減少實際淨值）
        const expenseAdjustment = heirExpenseAdjustments.value[heir.id] || new Decimal(0)

        // 分配差額 = 實際淨值 + 費用補償調整 - 預期淨值
        const difference = sub(add(actualNetValue, expenseAdjustment), expectedNetValue)

        return {
          ...heir,
          targetRatio,
          expectedNetValue,
          actualAssets,
          actualLiabilities,
          actualNetValue,
          expenseAdjustment,
          difference,
          inheritedProperties,
          expenseDetails: heirExpenseDetails.value[heir.id] || [],
        }
      })
    })

    // 總未分配資產淨值 = 可分配總淨值 - Σ(所有繼承人實際淨值)
    const totalUndistributedNetValue = computed(() => {
      const sumActualNet = heirsResults.value.reduce(
        (sum, h) => add(sum, h.actualNetValue),
        new Decimal(0)
      )
      return sub(netDistributableValue.value, sumActualNet)
    })

    // --- 方法 (Actions) ---
    const addCash = (name: string, amount: number) => {
      const id = 'cash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      cashList.value.push({ id, name, amount })
    }

    const editCash = (id: string, name: string, amount: number) => {
      const idx = cashList.value.findIndex((c) => c.id === id)
      if (idx !== -1) {
        cashList.value[idx] = { id, name, amount }
      }
    }

    const deleteCash = (id: string) => {
      cashList.value = cashList.value.filter((c) => c.id !== id)
      delete allocations.value[id]
    }

    const addRealEstate = (name: string, value: number, mortgage: number, rate: number) => {
      const id = 're_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      realEstateList.value.push({ id, name, value, mortgage, rate })
    }

    const editRealEstate = (id: string, name: string, value: number, mortgage: number, rate: number) => {
      const idx = realEstateList.value.findIndex((r) => r.id === id)
      if (idx !== -1) {
        realEstateList.value[idx] = { id, name, value, mortgage, rate }
      }
    }

    const deleteRealEstate = (id: string) => {
      realEstateList.value = realEstateList.value.filter((r) => r.id !== id)
      delete allocations.value[id]
    }

    const addCommonExpense = (name: string, amount: number, paidByHeirId?: string) => {
      const id = 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      commonExpenseList.value.push({ id, name, amount, paidByHeirId })
    }

    const editCommonExpense = (id: string, name: string, amount: number, paidByHeirId?: string) => {
      const idx = commonExpenseList.value.findIndex((e) => e.id === id)
      if (idx !== -1) {
        commonExpenseList.value[idx] = { id, name, amount, paidByHeirId }
      }
    }

    const deleteCommonExpense = (id: string) => {
      commonExpenseList.value = commonExpenseList.value.filter((e) => e.id !== id)
    }

    const addHeir = (name: string, targetShareStr: string) => {
      const id = 'heir_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      heirList.value.push({ id, name, targetShareStr })
    }

    const editHeir = (id: string, name: string, targetShareStr: string) => {
      const idx = heirList.value.findIndex((h) => h.id === id)
      if (idx !== -1) {
        heirList.value[idx] = { id, name, targetShareStr }
      }
    }

    const deleteHeir = (id: string) => {
      heirList.value = heirList.value.filter((h) => h.id !== id)
      // 清理分配給該繼承人的比例
      Object.keys(allocations.value).forEach((itemId) => {
        if (allocations.value[itemId]) {
          delete allocations.value[itemId][id]
        }
      })
    }

    const updateAllocation = (itemId: string, heirId: string, ratioStr: string) => {
      if (!allocations.value[itemId]) {
        allocations.value[itemId] = {}
      }
      const trimmed = ratioStr.trim()
      if (trimmed === '') {
        delete allocations.value[itemId][heirId]
      } else {
        allocations.value[itemId][heirId] = ratioStr
      }
    }

    // 重設為初始範例資料
    const resetToDefault = () => {
      cashList.value = [
        { id: 'cash_1', name: '銀行存款 - 活期台幣', amount: 5000000 },
        { id: 'cash_2', name: '證券戶 - 股票市值', amount: 3000000 },
      ]
      realEstateList.value = [
        { id: 're_1', name: '台北大安區電梯大樓', value: 30000000, mortgage: 8000000, rate: 2.1 },
        { id: 're_2', name: '新北板橋區公寓', value: 15000000, mortgage: 2000000, rate: 2.25 },
      ]
      commonExpenseList.value = [
        { id: 'exp_1', name: '預估遺產稅', amount: 1500000, paidByHeirId: 'heir_1' },
        { id: 'exp_2', name: '喪葬與相關儀式費用', amount: 500000, paidByHeirId: '' },
      ]
      heirList.value = [
        { id: 'heir_1', name: '長子 小明', targetShareStr: '1/3' },
        { id: 'heir_2', name: '次子 小華', targetShareStr: '1/3' },
        { id: 'heir_3', name: '長女 小美', targetShareStr: '1/3' },
      ]
      allocations.value = {
        cash_1: { heir_1: '1/3', heir_2: '1/3', heir_3: '1/3' },
        cash_2: { heir_1: '1/3', heir_2: '1/3', heir_3: '1/3' },
        re_1: { heir_1: '1/2', heir_3: '1/2' },
        re_2: { heir_2: '1' },
      }
    }

    return {
      cashList,
      realEstateList,
      commonExpenseList,
      heirList,
      allocations,
      totalCash,
      totalRealEstateValue,
      totalRealEstateMortgage,
      totalAssets,
      totalLiabilities,
      totalCommonExpenses,
      netDistributableValue,
      heirExpenseAdjustments,
      heirExpenseDetails,
      itemAllocationStatus,
      heirsResults,
      totalUndistributedNetValue,
      addCash,
      editCash,
      deleteCash,
      addRealEstate,
      editRealEstate,
      deleteRealEstate,
      addCommonExpense,
      editCommonExpense,
      deleteCommonExpense,
      addHeir,
      editHeir,
      deleteHeir,
      updateAllocation,
      resetToDefault,
    }
  },
  {
    persist: true,
  }
)
