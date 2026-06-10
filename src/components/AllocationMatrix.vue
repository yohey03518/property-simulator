<script setup lang="ts">
import { useInheritanceStore } from '@/stores/inheritance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatRatioAsPercent } from '@/utils/fraction'
import { Scale, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const store = useInheritanceStore()

// 格式化為台幣千分位
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val)
}

// 獲取分配比例 (字串型態，若無則為空字串)
const getAllocationVal = (itemId: string, heirId: string) => {
  return store.allocations[itemId]?.[heirId] || ''
}


</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <Scale class="h-4 w-4 text-sky-500" /> 資產分配指派面板
      </CardTitle>
      <CardDescription class="text-xs">
        在此針對每筆獨立的「現金」或「房產」指派各繼承人的繼承佔比。輸入支援分數 (如 1/3) 或百分比 (如 50%)。
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div v-if="store.cashList.length === 0 && store.realEstateList.length === 0" class="text-center py-8 text-xs text-muted-foreground">
        請先至左側資產管理頁面新增資產項目。
      </div>
      <div v-else-if="store.heirList.length === 0" class="text-center py-8 text-xs text-muted-foreground">
        請先至左側繼承人管理頁面新增繼承人。
      </div>
      <div v-else class="space-y-6">
        
        <!-- 現金分配卡片組 -->
        <div class="space-y-4" v-if="store.cashList.length > 0">
          <h3 class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">現金資產分配</h3>
          <div class="grid gap-4">
            <Card v-for="cash in store.cashList" :key="cash.id" class="border shadow-none">
              <CardHeader class="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div>
                  <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-100">{{ cash.name }}</h4>
                  <p class="text-xs text-muted-foreground mt-0.5">總額：{{ formatCurrency(cash.amount) }}</p>
                </div>
                
                <!-- 分配進度 Badge -->
                <div>
                  <span 
                    v-if="store.itemAllocationStatus[cash.id]?.isOver" 
                    class="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900"
                  >
                    <AlertCircle class="h-3 w-3" /> 分配超出 100%
                  </span>
                  <span 
                    v-else-if="store.itemAllocationStatus[cash.id]?.allocated.isZero()" 
                    class="text-xs text-muted-foreground bg-slate-100 border px-2 py-0.5 rounded dark:bg-slate-900"
                  >
                    未分配
                  </span>
                  <span 
                    v-else-if="store.itemAllocationStatus[cash.id]?.allocated.equals(1)" 
                    class="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900"
                  >
                    <CheckCircle2 class="h-3 w-3" /> 已分完
                  </span>
                  <span 
                    v-else 
                    class="text-xs text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded dark:bg-sky-950/20 dark:border-sky-900 dark:text-sky-400"
                  >
                    已分配 {{ formatRatioAsPercent(store.itemAllocationStatus[cash.id]?.allocated!) }}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent class="p-4 pt-2 space-y-3">
                <!-- 進度條 -->
                <div class="space-y-1">
                  <div class="flex justify-between text-2xs text-muted-foreground">
                    <span>已指派：{{ formatRatioAsPercent(store.itemAllocationStatus[cash.id]?.allocated!) }}</span>
                    <span>剩餘：{{ formatRatioAsPercent(store.itemAllocationStatus[cash.id]?.remaining!) }}</span>
                  </div>
                  <!-- 進度條顏色適配 -->
                  <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <div 
                      class="h-full transition-all duration-300"
                      :class="store.itemAllocationStatus[cash.id]?.isOver ? 'bg-rose-500' : 'bg-emerald-500'"
                      :style="`width: ${Math.min(100, store.itemAllocationStatus[cash.id]?.allocated.times(100).toNumber() || 0)}%`"
                    ></div>
                  </div>
                </div>

                <!-- 繼承人分配佔比輸入 (列式排版，防止擠壓) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div 
                    v-for="heir in store.heirList" 
                    :key="heir.id" 
                    class="flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded border border-slate-100 dark:border-slate-800"
                  >
                    <span class="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">{{ heir.name }}</span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs text-muted-foreground">分配:</span>
                      <Input 
                        :model-value="getAllocationVal(cash.id, heir.id)"
                        @update:model-value="val => store.updateAllocation(cash.id, heir.id, String(val))"
                        placeholder="如 1/3" 
                        class="h-7 text-xs w-20 text-center" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- 房產分配卡片組 -->
        <div class="space-y-4" v-if="store.realEstateList.length > 0">
          <h3 class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">房產資產與貸款分配</h3>
          <div class="grid gap-4">
            <Card v-for="re in store.realEstateList" :key="re.id" class="border shadow-none">
              <CardHeader class="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div>
                  <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-100">{{ re.name }}</h4>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    現值：{{ formatCurrency(re.value) }} ｜ 剩餘房貸：{{ formatCurrency(re.mortgage) }}
                  </p>
                </div>
                
                <!-- 分配進度 Badge -->
                <div>
                  <span 
                    v-if="store.itemAllocationStatus[re.id]?.isOver" 
                    class="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900"
                  >
                    <AlertCircle class="h-3 w-3" /> 分配超出 100%
                  </span>
                  <span 
                    v-else-if="store.itemAllocationStatus[re.id]?.allocated.isZero()" 
                    class="text-xs text-muted-foreground bg-slate-100 border px-2 py-0.5 rounded dark:bg-slate-900"
                  >
                    未分配
                  </span>
                  <span 
                    v-else-if="store.itemAllocationStatus[re.id]?.allocated.equals(1)" 
                    class="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900"
                  >
                    <CheckCircle2 class="h-3 w-3" /> 已分完
                  </span>
                  <span 
                    v-else 
                    class="text-xs text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded dark:bg-sky-950/20 dark:border-sky-900 dark:text-sky-400"
                  >
                    已分配 {{ formatRatioAsPercent(store.itemAllocationStatus[re.id]?.allocated!) }}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent class="p-4 pt-2 space-y-3">
                <!-- 進度條 -->
                <div class="space-y-1">
                  <div class="flex justify-between text-2xs text-muted-foreground">
                    <span>已指派：{{ formatRatioAsPercent(store.itemAllocationStatus[re.id]?.allocated!) }}</span>
                    <span>剩餘：{{ formatRatioAsPercent(store.itemAllocationStatus[re.id]?.remaining!) }}</span>
                  </div>
                  <!-- 進度條 -->
                  <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <div 
                      class="h-full transition-all duration-300"
                      :class="store.itemAllocationStatus[re.id]?.isOver ? 'bg-rose-500' : 'bg-emerald-500'"
                      :style="`width: ${Math.min(100, store.itemAllocationStatus[re.id]?.allocated.times(100).toNumber() || 0)}%`"
                    ></div>
                  </div>
                </div>

                <!-- 繼承人分配佔比輸入 (列式排版，防止擠壓) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div 
                    v-for="heir in store.heirList" 
                    :key="heir.id" 
                    class="flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded border border-slate-100 dark:border-slate-800"
                  >
                    <span class="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">{{ heir.name }}</span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs text-muted-foreground">分配:</span>
                      <Input 
                        :model-value="getAllocationVal(re.id, heir.id)"
                        @update:model-value="val => store.updateAllocation(re.id, heir.id, String(val))"
                        placeholder="如 1/3" 
                        class="h-7 text-xs w-20 text-center" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </CardContent>
  </Card>
</template>
