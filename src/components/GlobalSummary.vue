<script setup lang="ts">
import { computed } from 'vue'
import { useInheritanceStore } from '@/stores/inheritance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, ShieldAlert, BadgeDollarSign, Wallet, FileText } from 'lucide-vue-next'

const store = useInheritanceStore()

// 格式化為台幣千分位
const formatCurrency = (val: any) => {
  const num = typeof val.toNumber === 'function' ? val.toNumber() : Number(val)
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(num)
}

// 根據未分配淨值計算狀態
const undistributedState = computed(() => {
  const val = store.totalUndistributedNetValue
  if (val.isZero()) {
    return {
      text: '已完全分配完畢',
      bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
    }
  } else if (val.gt(0)) {
    return {
      text: `尚有資產未指派 (${formatCurrency(val)})`,
      bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-400',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
    }
  } else {
    return {
      text: `分配超出總淨額 (${formatCurrency(val.abs())})`,
      bgColor: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800',
      textColor: 'text-rose-700 dark:text-rose-400',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- 防呆提示懸浮 / 置頂區塊 -->
    <div 
      class="border rounded-lg p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      :class="undistributedState.bgColor"
    >
      <div class="flex items-center space-x-3">
        <ShieldAlert class="h-5 w-5" :class="undistributedState.textColor" />
        <div>
          <h3 class="text-sm font-semibold" :class="undistributedState.textColor">
            分配防呆狀態提示
          </h3>
          <p class="text-xs opacity-90 mt-0.5" :class="undistributedState.textColor">
            實體資產與負債需完全分配。共同費用已納入預期淨值，並透過多退少補差額結算。
          </p>
        </div>
      </div>
      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" :class="undistributedState.badgeColor">
        {{ undistributedState.text }}
      </span>
    </div>

    <!-- 總數值指標卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card class="overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle class="text-xs font-medium text-muted-foreground">總資產價值</CardTitle>
          <BadgeDollarSign class="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <div class="text-base md:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(store.totalAssets) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">現金 + 房產現值</p>
        </CardContent>
      </Card>

      <Card class="overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle class="text-xs font-medium text-muted-foreground">總負債價值</CardTitle>
          <Landmark class="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <div class="text-base md:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {{ formatCurrency(store.totalLiabilities) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">房產貸款總額</p>
        </CardContent>
      </Card>

      <Card class="overflow-hidden">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle class="text-xs font-medium text-muted-foreground">共同支出與稅費</CardTitle>
          <FileText class="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <div class="text-base md:text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
            {{ formatCurrency(store.totalCommonExpenses) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">遺產稅、喪葬費等</p>
        </CardContent>
      </Card>

      <Card class="overflow-hidden bg-primary/5 border-primary/20">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle class="text-xs font-medium text-muted-foreground">可分配總淨值</CardTitle>
          <Wallet class="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent class="p-4 pt-0">
          <div class="text-base md:text-2xl font-bold tracking-tight text-primary">
            {{ formatCurrency(store.netDistributableValue) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">資產 - 負債 - 共同支出</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
