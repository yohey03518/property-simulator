<script setup lang="ts">
import { ref } from 'vue'
import { useInheritanceStore } from '@/stores/inheritance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit2, Check, X, Building2, Wallet, FileSpreadsheet, User } from 'lucide-vue-next'

const store = useInheritanceStore()

// 格式化為台幣千分位
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val)
}

// 狀態變數：用於新增/編輯表單
const cashForm = ref({ id: '', name: '', amount: 0, show: false, editMode: false })
const reForm = ref({ id: '', name: '', value: 0, mortgage: 0, rate: 2.1, show: false, editMode: false })
const expForm = ref({ id: '', name: '', amount: 0, paidByHeirId: '', show: false, editMode: false })

// --- 現金操作 ---
const resetCashForm = () => {
  cashForm.value = { id: '', name: '', amount: 0, show: false, editMode: false }
}
const handleAddCashClick = () => {
  cashForm.value = { id: '', name: '', amount: 0, show: true, editMode: false }
}
const handleEditCashClick = (item: any) => {
  cashForm.value = { id: item.id, name: item.name, amount: item.amount, show: true, editMode: true }
}
const saveCash = () => {
  if (!cashForm.value.name.trim() || cashForm.value.amount < 0) return
  if (cashForm.value.editMode) {
    store.editCash(cashForm.value.id, cashForm.value.name.trim(), cashForm.value.amount)
  } else {
    store.addCash(cashForm.value.name.trim(), cashForm.value.amount)
  }
  resetCashForm()
}

// --- 房產操作 ---
const resetReForm = () => {
  reForm.value = { id: '', name: '', value: 0, mortgage: 0, rate: 2.1, show: false, editMode: false }
}
const handleAddReClick = () => {
  reForm.value = { id: '', name: '', value: 0, mortgage: 0, rate: 2.1, show: true, editMode: false }
}
const handleEditReClick = (item: any) => {
  reForm.value = { id: item.id, name: item.name, value: item.value, mortgage: item.mortgage, rate: item.rate, show: true, editMode: true }
}
const saveRealEstate = () => {
  if (!reForm.value.name.trim() || reForm.value.value < 0 || reForm.value.mortgage < 0 || reForm.value.rate < 0) return
  if (reForm.value.editMode) {
    store.editRealEstate(reForm.value.id, reForm.value.name.trim(), reForm.value.value, reForm.value.mortgage, reForm.value.rate)
  } else {
    store.addRealEstate(reForm.value.name.trim(), reForm.value.value, reForm.value.mortgage, reForm.value.rate)
  }
  resetReForm()
}

// --- 共同支出操作 ---
// reka-ui 的 Select 不接受空字串，用 '__none__' 代替「未指定預付者」選項
const NONE_PAYER = '__none__'

const handleAddExpClick = () => {
  expForm.value = { id: '', name: '', amount: 0, paidByHeirId: NONE_PAYER, show: true, editMode: false }
}
const handleEditExpClick = (item: any) => {
  expForm.value = { id: item.id, name: item.name, amount: item.amount, paidByHeirId: item.paidByHeirId || NONE_PAYER, show: true, editMode: true }
}
const cancelExpForm = () => {
  expForm.value = { id: '', name: '', amount: 0, paidByHeirId: NONE_PAYER, show: false, editMode: false }
}
const saveExpense = () => {
  if (!expForm.value.name.trim() || expForm.value.amount < 0) return
  // sentinel '__none__' 轉回 undefined（表示共同從總淨值扣除）
  const paidById = expForm.value.paidByHeirId === NONE_PAYER ? undefined : expForm.value.paidByHeirId
  if (expForm.value.editMode) {
    store.editCommonExpense(expForm.value.id, expForm.value.name.trim(), expForm.value.amount, paidById)
  } else {
    store.addCommonExpense(expForm.value.name.trim(), expForm.value.amount, paidById)
  }
  cancelExpForm()
}
</script>

<template>
  <div class="space-y-6">
    <!-- 1. 現金資產管理 -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle class="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Wallet class="h-4 w-4 text-emerald-500" /> 現金與動產清單
          </CardTitle>
          <CardDescription class="text-xs">管理存款、證券等現金資產項目</CardDescription>
        </div>
        <Button size="sm" class="h-8" @click="handleAddCashClick" v-if="!cashForm.show">
          <Plus class="h-4.5 w-4.5 mr-1" /> 新增現金
        </Button>
      </CardHeader>
      <CardContent class="space-y-3">
        <!-- 現金新增 / 編輯表單 -->
        <div v-if="cashForm.show" class="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
          <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ cashForm.editMode ? '編輯現金項目' : '新增現金項目' }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label class="text-xs">項目名稱</Label>
              <Input v-model="cashForm.name" placeholder="例如：銀行存款" class="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label class="text-xs">金額 (元)</Label>
              <Input v-model.number="cashForm.amount" type="number" min="0" class="h-8 text-xs mt-1" />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button size="sm" variant="ghost" class="h-8 text-xs" @click="resetCashForm">
              <X class="h-4 w-4 mr-1" /> 取消
            </Button>
            <Button size="sm" class="h-8 text-xs" @click="saveCash" :disabled="!cashForm.name.trim() || cashForm.amount < 0">
              <Check class="h-4 w-4 mr-1" /> 儲存
            </Button>
          </div>
        </div>

        <!-- 現金清單列表 -->
        <div v-if="store.cashList.length === 0" class="text-center py-6 text-xs text-muted-foreground">
          目前無任何現金項目
        </div>
        <div v-else class="divide-y border rounded-lg overflow-hidden">
          <div v-for="item in store.cashList" :key="item.id" class="p-3 flex items-center justify-between gap-3 text-xs bg-card">
            <div class="min-w-0 flex-1">
              <div class="font-medium text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                金額：{{ formatCurrency(item.amount) }}
              </div>
            </div>
            <div class="flex-shrink-0 flex items-center gap-1">
              <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-primary" @click="handleEditCashClick(item)">
                <Edit2 class="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="store.deleteCash(item.id)">
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 2. 房產與不動產管理 -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle class="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Building2 class="h-4 w-4 text-blue-500" /> 房產與不動產清單
          </CardTitle>
          <CardDescription class="text-xs">管理房屋、土地與剩餘房貸設定</CardDescription>
        </div>
        <Button size="sm" class="h-8" @click="handleAddReClick" v-if="!reForm.show">
          <Plus class="h-4.5 w-4.5 mr-1" /> 新增房產
        </Button>
      </CardHeader>
      <CardContent class="space-y-3">
        <!-- 房產新增 / 編輯表單 -->
        <div v-if="reForm.show" class="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
          <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ reForm.editMode ? '編輯房產項目' : '新增房產項目' }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <Label class="text-xs">房產名稱</Label>
              <Input v-model="reForm.name" placeholder="例如：大安區電梯大樓" class="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label class="text-xs">房屋現值 (元)</Label>
              <Input v-model.number="reForm.value" type="number" min="0" class="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label class="text-xs">剩餘貸款 (元)</Label>
              <Input v-model.number="reForm.mortgage" type="number" min="0" class="h-8 text-xs mt-1" />
            </div>
            <div class="col-span-2">
              <Label class="text-xs">房貸年利率 (%)</Label>
              <Input v-model.number="reForm.rate" type="number" step="0.01" min="0" class="h-8 text-xs mt-1" />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button size="sm" variant="ghost" class="h-8 text-xs" @click="resetReForm">
              <X class="h-4 w-4 mr-1" /> 取消
            </Button>
            <Button size="sm" class="h-8 text-xs" @click="saveRealEstate" :disabled="!reForm.name.trim() || reForm.value < 0 || reForm.mortgage < 0 || reForm.rate < 0">
              <Check class="h-4 w-4 mr-1" /> 儲存
            </Button>
          </div>
        </div>

        <!-- 房產清單列表 -->
        <div v-if="store.realEstateList.length === 0" class="text-center py-6 text-xs text-muted-foreground">
          目前無任何房產項目
        </div>
        <div v-else class="divide-y border rounded-lg overflow-hidden">
          <div v-for="item in store.realEstateList" :key="item.id" class="p-3 flex items-center justify-between gap-3 text-xs bg-card">
            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="font-medium text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</div>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span class="text-emerald-600 dark:text-emerald-400">現值：{{ formatCurrency(item.value) }}</span>
                <span class="text-rose-600 dark:text-rose-400">貸款：{{ formatCurrency(item.mortgage) }}</span>
                <span class="text-blue-600 dark:text-blue-400">利率：{{ item.rate }}%</span>
              </div>
            </div>
            <div class="flex-shrink-0 flex items-center gap-1">
              <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-primary" @click="handleEditReClick(item)">
                <Edit2 class="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="store.deleteRealEstate(item.id)">
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 3. 共同支出與稅費管理 -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle class="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <FileSpreadsheet class="h-4 w-4 text-orange-500" /> 共同支出與稅費
          </CardTitle>
          <CardDescription class="text-xs">管理喪葬費、預估稅費等各項公共扣除項目</CardDescription>
        </div>
        <Button size="sm" class="h-8" @click="handleAddExpClick" v-if="!expForm.show">
          <Plus class="h-4.5 w-4.5 mr-1" /> 新增支出
        </Button>
      </CardHeader>
      <CardContent class="space-y-3">
        <!-- 共同支出新增 / 編輯表單 -->
        <div v-if="expForm.show" class="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
          <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ expForm.editMode ? '編輯支出項目' : '新增支出項目' }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label class="text-xs">支出名稱</Label>
              <Input v-model="expForm.name" placeholder="例如：遺產稅" class="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label class="text-xs">金額 (元)</Label>
              <Input v-model.number="expForm.amount" type="number" min="0" class="h-8 text-xs mt-1" />
            </div>
          </div>
          <!-- 預先支付者選擇 -->
          <div>
            <Label class="text-xs flex items-center gap-1">
              <User class="h-3 w-3" /> 預先支付者
            </Label>
            <p class="text-2xs text-muted-foreground mt-0.5 mb-1.5">(選項) 若某繼承人已預先支付此項費用，可在此指定。該人後續將收回其他人應分擔的費用。</p>
            <Select v-model="expForm.paidByHeirId">
              <SelectTrigger class="h-8 text-xs">
                <SelectValue placeholder="未指定（共同從總淨值扣除）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__"><span class="text-muted-foreground">未指定（共同按份從總淨值扣除）</span></SelectItem>
                <SelectItem v-for="heir in store.heirList" :key="heir.id" :value="heir.id">
                  {{ heir.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex justify-end gap-2">
            <Button size="sm" variant="ghost" class="h-8 text-xs" @click="cancelExpForm">
              <X class="h-4 w-4 mr-1" /> 取消
            </Button>
            <Button size="sm" class="h-8 text-xs" @click="saveExpense" :disabled="!expForm.name.trim() || expForm.amount < 0">
              <Check class="h-4 w-4 mr-1" /> 儲存
            </Button>
          </div>
        </div>

        <!-- 支出清單列表 -->
        <div v-if="store.commonExpenseList.length === 0" class="text-center py-6 text-xs text-muted-foreground">
          目前無任何共同支出項目
        </div>
        <div v-else class="divide-y border rounded-lg overflow-hidden">
          <div v-for="item in store.commonExpenseList" :key="item.id" class="p-3 flex items-center justify-between gap-3 text-xs bg-card">
            <div class="min-w-0 flex-1">
              <div class="font-medium text-slate-800 dark:text-slate-100 truncate">「{{ item.name }}」</div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                <span class="text-orange-600 dark:text-orange-400">金額：{{ formatCurrency(item.amount) }}</span>
                <span v-if="item.paidByHeirId" class="inline-flex items-center gap-0.5 text-2xs font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
                  <User class="h-2.5 w-2.5" />
                  預付：{{ store.heirList.find(h => h.id === item.paidByHeirId)?.name ?? '不明' }}
                </span>
                <span v-else class="inline-flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  共同從總淨值扣除
                </span>
              </div>
            </div>
            <div class="flex-shrink-0 flex items-center gap-1">
              <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-primary" @click="handleEditExpClick(item)">
                <Edit2 class="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="store.deleteCommonExpense(item.id)">
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
