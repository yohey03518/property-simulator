<script setup lang="ts">
import { ref } from 'vue'
import { useInheritanceStore } from '@/stores/inheritance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseRatioStr, formatRatioAsPercent } from '@/utils/fraction'
import { Plus, Trash2, Edit2, Check, X, Users, AlertTriangle } from 'lucide-vue-next'

const store = useInheritanceStore()

// 狀態變數：用於新增/編輯繼承人
const heirForm = ref({ id: '', name: '', targetShareStr: '1/3', show: false, editMode: false })

const resetHeirForm = () => {
  heirForm.value = { id: '', name: '', targetShareStr: '1/3', show: false, editMode: false }
}
const handleAddHeirClick = () => {
  heirForm.value = { id: '', name: '', targetShareStr: '1/3', show: true, editMode: false }
}
const handleEditHeirClick = (item: any) => {
  heirForm.value = { id: item.id, name: item.name, targetShareStr: item.targetShareStr, show: true, editMode: true }
}

const saveHeir = () => {
  if (!heirForm.value.name.trim() || !heirForm.value.targetShareStr.trim()) return
  if (heirForm.value.editMode) {
    store.editHeir(heirForm.value.id, heirForm.value.name.trim(), heirForm.value.targetShareStr.trim())
  } else {
    store.addHeir(heirForm.value.name.trim(), heirForm.value.targetShareStr.trim())
  }
  resetHeirForm()
}

// 實時驗證輸入比例字串
const getParsedValue = (str: string) => {
  try {
    const val = parseRatioStr(str)
    if (val.isNaN() || val.isNegative()) return null
    return val
  } catch {
    return null
  }
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
      <div>
        <CardTitle class="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Users class="h-4 w-4 text-violet-500" /> 繼承人名單與應得比例
        </CardTitle>
        <CardDescription class="text-xs">設定各繼承人名冊與法定/約定之分配份數</CardDescription>
      </div>
      <Button size="sm" class="h-8" @click="handleAddHeirClick" v-if="!heirForm.show">
        <Plus class="h-4.5 w-4.5 mr-1" /> 新增繼承人
      </Button>
    </CardHeader>
    <CardContent class="space-y-3">
      <div v-if="heirForm.show" class="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
        <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {{ heirForm.editMode ? '編輯繼承人資料' : '新增繼承人' }}
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label class="text-xs">繼承人名稱</Label>
            <Input v-model="heirForm.name" placeholder="例如：長子 小明" class="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label class="text-xs">目標分配比例/持份</Label>
            <Input v-model="heirForm.targetShareStr" placeholder="例如：1/3, 50%, 0.25" class="h-8 text-xs mt-1" />
          </div>
        </div>

        <!-- 即時比例解析提示 -->
        <div class="text-xs text-muted-foreground flex items-center gap-1">
          <span v-if="getParsedValue(heirForm.targetShareStr)">
            解析結果：將分配總淨值的 <strong class="text-violet-600 dark:text-violet-400">{{ formatRatioAsPercent(getParsedValue(heirForm.targetShareStr)!) }}</strong>
          </span>
          <span v-else class="text-rose-500 flex items-center gap-0.5">
            <AlertTriangle class="h-3 w-3" /> 輸入格式有誤，將視為 0% 進行運算
          </span>
        </div>

        <div class="flex justify-end gap-2">
          <Button size="sm" variant="ghost" class="h-8 text-xs" @click="resetHeirForm">
            <X class="h-4 w-4 mr-1" /> 取消
          </Button>
          <Button size="sm" class="h-8 text-xs" @click="saveHeir" :disabled="!heirForm.name.trim() || !heirForm.targetShareStr.trim()">
            <Check class="h-4 w-4 mr-1" /> 儲存
          </Button>
        </div>
      </div>

      <!-- 繼承人列表 -->
      <div v-if="store.heirList.length === 0" class="text-center py-6 text-xs text-muted-foreground">
        目前無任何繼承人設定
      </div>
      <div v-else class="divide-y border rounded-lg overflow-hidden">
        <div v-for="item in store.heirList" :key="item.id" class="p-3 flex items-center justify-between gap-3 text-xs bg-card">
          <div class="min-w-0 flex-1">
            <div class="font-medium text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</div>
            <div class="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
              目標持份：{{ item.targetShareStr }} ({{ formatRatioAsPercent(parseRatioStr(item.targetShareStr)) }})
            </div>
          </div>
          <div class="flex-shrink-0 flex items-center gap-1">
            <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-primary" @click="handleEditHeirClick(item)">
              <Edit2 class="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="store.deleteHeir(item.id)">
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
