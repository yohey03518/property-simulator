<script setup lang="ts">
import { useInheritanceStore } from '@/stores/inheritance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateMortgage } from '@/utils/mortgage'
import { formatRatioAsPercent } from '@/utils/fraction'
import { Coins, Landmark, Receipt, ArrowDownLeft, ArrowUpRight } from 'lucide-vue-next'
import { Decimal } from 'decimal.js'

const store = useInheritanceStore()

// 格式化為台幣千分位
const formatCurrency = (val: any) => {
  const num = typeof val.toNumber === 'function' ? val.toNumber() : Number(val)
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(num)
}

// 格式化月繳金額 (保留至整數位，加元字)
const formatMonthlyPayment = (val: any) => {
  const num = typeof val.toNumber === 'function' ? val.toNumber() : Number(val)
  return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(num) + ' 元/月'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-2 border-b">
      <div>
        <h2 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Coins class="h-5 w-5 text-amber-500" /> 各繼承人分配結果與試算
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">即時試算各人預期與實際取得淨值差額（多退少補）與繼承房貸負擔。</p>
      </div>
    </div>

    <div v-if="store.heirList.length === 0" class="text-center py-12 text-xs text-muted-foreground">
      請先於左側面板新增繼承人。
    </div>
    
    <div v-else class="grid gap-6">
      <!-- 繼承人獨立卡片區塊 -->
      <Card v-for="heir in store.heirsResults" :key="heir.id" class="border-l-4" :class="heir.difference.isZero() ? 'border-l-emerald-500' : heir.difference.gt(0) ? 'border-l-amber-500' : 'border-l-sky-500'">
        <CardHeader class="p-4 pb-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle class="text-base font-bold text-slate-800 dark:text-slate-100">{{ heir.name }}</CardTitle>
              <CardDescription class="text-xs mt-0.5">
                目標份數比例：{{ heir.targetShareStr }} ({{ formatRatioAsPercent(heir.targetRatio) }})
              </CardDescription>
            </div>
            
            <!-- 分配差額 Badge -->
            <div class="text-left sm:text-right">
              <div 
                class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
                :class="heir.difference.isZero() ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' : heir.difference.gt(0) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-400'"
              >
                <span v-if="heir.difference.isZero()">已達平衡額 (0)</span>
                <span v-else-if="heir.difference.gt(0)">
                  溢領：+{{ formatCurrency(heir.difference) }} (需補償他人)
                </span>
                <span v-else>
                  短領：{{ formatCurrency(heir.difference) }} (應獲他人補償)
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent class="p-4 pt-2 space-y-4">
          <!-- 財務詳細指標網格 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-3 bg-slate-50/30 dark:bg-slate-900/10">
            <div>
              <div class="text-xs text-muted-foreground">預期應得淨值</div>
              <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                {{ formatCurrency(heir.expectedNetValue) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">實際取得資產</div>
              <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {{ formatCurrency(heir.actualAssets) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">實際承接債務</div>
              <div class="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                {{ formatCurrency(heir.actualLiabilities) }}
              </div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">實際分配淨值</div>
              <div class="text-sm font-bold text-primary mt-0.5">
                {{ formatCurrency(heir.actualNetValue) }}
              </div>
            </div>
          </div>

          <!-- 共同費用補償明細 -->
          <div v-if="store.commonExpenseList.length > 0" class="space-y-1.5">
            <div class="flex items-center gap-1.5">
              <Receipt class="h-4 w-4 text-violet-500" />
              <h4 class="text-xs font-bold text-violet-600 dark:text-violet-400">共同費用分擔與補償明細</h4>
            </div>
            <div class="divide-y border rounded-lg overflow-hidden text-xs">
              <div v-for="detail in heir.expenseDetails" :key="detail.expenseId" class="p-2 flex justify-between items-center bg-card gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <!-- 預付者標記 -->
                  <span
                    v-if="store.commonExpenseList.find(e => e.id === detail.expenseId)?.paidByHeirId"
                    class="flex-shrink-0 inline-flex items-center gap-0.5 text-2xs font-semibold px-1 py-0.5 rounded"
                    :class="detail.isPayer
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
                  >
                    <ArrowDownLeft v-if="detail.isPayer" class="h-2.5 w-2.5" />
                    <ArrowUpRight v-else class="h-2.5 w-2.5" />
                    {{ detail.isPayer ? '預付' : '應補' }}
                  </span>
                  <span v-else class="flex-shrink-0 text-2xs px-1 py-0.5 rounded bg-slate-100 text-slate-400 dark:bg-slate-800">共同扣</span>
                  <span class="text-slate-600 dark:text-slate-300 truncate">{{ detail.name }}</span>
                </div>
                <div class="flex-shrink-0 text-right">
                  <div class="text-slate-600 dark:text-slate-400">自擔份額：{{ formatCurrency(detail.amount) }}</div>
                  <!-- 預付者：顯示可向其他人收回的金額（其他人的份額合計）-->
                  <div
                    v-if="detail.isPayer && !detail.adjustment.isZero()"
                    class="font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    ＋可收回：{{ formatCurrency(detail.adjustment.abs()) }}
                  </div>
                  <!-- 非預付者：顯示應補付給預付者的金額（由最終清算差額自動結算）-->
                  <div
                    v-else-if="!detail.isPayer && !detail.adjustment.isZero()"
                    class="font-semibold text-rose-600 dark:text-rose-400"
                  >
                    －需補付：{{ formatCurrency(detail.adjustment.abs()) }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 預付者：已從口袋先付出全額，使其差額下調，最終從清算收回 -->
            <div v-if="!heir.expenseAdjustment.isZero()" class="flex justify-end">
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                已預付全額，差額調整：－{{ formatCurrency(heir.expenseAdjustment.abs()) }}
              </span>
            </div>
          </div>

          <!-- 分得之明細 -->
          <div class="space-y-1" v-if="heir.inheritedProperties.length > 0">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">分得房產與債務細項</h4>
            <div class="divide-y border rounded-lg overflow-hidden text-xs">
              <div v-for="prop in heir.inheritedProperties" :key="prop.id" class="p-2 flex justify-between bg-card">
                <div>
                  <span class="font-medium text-slate-800 dark:text-slate-100">{{ prop.name }}</span>
                  <span class="ml-1 text-slate-500">(持份: {{ formatRatioAsPercent(prop.allocatedRatio) }})</span>
                </div>
                <div class="space-x-3">
                  <span class="text-emerald-600 dark:text-emerald-400">現值: {{ formatCurrency(prop.value) }}</span>
                  <span class="text-rose-600 dark:text-rose-400">房貸: {{ formatCurrency(prop.mortgage) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 房貸還款負擔試算 -->
          <div v-if="heir.actualLiabilities.gt(0)" class="space-y-2 pt-2 border-t border-dashed">
            <div class="flex items-center gap-1.5">
              <Landmark class="h-4 w-4 text-rose-500 animate-pulse" />
              <h4 class="text-xs font-bold text-rose-600 dark:text-rose-400">承接房貸負擔月還款試算</h4>
            </div>
            
            <p class="text-xs text-muted-foreground">
              依據繼承人承接的總貸款金額：<strong class="text-slate-800 dark:text-slate-200">{{ formatCurrency(heir.actualLiabilities) }}</strong> 進行試算。
              若有多間房產，此處已依各別利率加權混合併計算。
            </p>

            <!-- 20, 30, 40 年份並列顯示 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                v-for="term in [20, 30, 40]" 
                :key="term" 
                class="border rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5"
              >
                <div class="text-xs font-bold text-slate-700 dark:text-slate-300 border-b pb-1">
                  {{ term }} 年期貸款
                </div>
                
                <!-- 針對繼承人所分得的每一筆房產分別計算月付額，然後加總 -->
                <div class="space-y-1 text-xs">
                  <div>
                    <span class="text-muted-foreground block text-2xs">本息平均攤還：</span>
                    <span class="font-semibold text-rose-600 dark:text-rose-400">
                      {{ 
                        formatMonthlyPayment(
                          heir.inheritedProperties.reduce((sum, prop) => {
                            const result = calculateMortgage(prop.mortgage, prop.rate, term)
                            return sum.plus(result.principalAndInterest)
                          }, new Decimal(0))
                        ) 
                      }}
                    </span>
                  </div>
                  <div class="pt-0.5">
                    <span class="text-muted-foreground block text-2xs">只還利息 (寬限期)：</span>
                    <span class="font-medium text-slate-700 dark:text-slate-300">
                      {{ 
                        formatMonthlyPayment(
                          heir.inheritedProperties.reduce((sum, prop) => {
                            const result = calculateMortgage(prop.mortgage, prop.rate, term)
                            return sum.plus(result.interestOnly)
                          }, new Decimal(0))
                        ) 
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
        </CardContent>
      </Card>
    </div>
  </div>
</template>
