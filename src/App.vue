<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInheritanceStore } from '@/stores/inheritance'
import GlobalSummary from '@/components/GlobalSummary.vue'
import AssetManager from '@/components/AssetManager.vue'
import HeirManager from '@/components/HeirManager.vue'
import AllocationMatrix from '@/components/AllocationMatrix.vue'
import HeirResults from '@/components/HeirResults.vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Scale, RotateCcw, Sun, Moon, Info } from 'lucide-vue-next'

const store = useInheritanceStore()
const isDark = ref(false)

// 切換暗黑模式
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 根據系統偏好初始化模式
onMounted(() => {
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (preferDark) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/30 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans pb-12 transition-colors duration-300">
    <!-- 頂部導航/標題列 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div class="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Scale class="h-6 w-6 text-primary" />
          <div>
            <h1 class="text-sm md:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              遺產分配與房貸負擔試算器
            </h1>
            <p class="text-xs md:text-sm text-muted-foreground hidden sm:block">
              高精度浮點數計算 ｜ 房貸負擔多期試算 ｜ 支援分數與百分比輸入
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- 重置按鈕 -->
          <Button variant="outline" size="sm" class="h-8 px-2 sm:px-3 text-xs" @click="store.resetToDefault" title="重置範例">
            <RotateCcw class="h-3.5 w-3.5 sm:mr-1" /> 
            <span class="hidden sm:inline">重置範例</span>
          </Button>

          <!-- 主題切換按鈕 -->
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleDarkMode">
            <Sun v-if="isDark" class="h-4 w-4 text-amber-500 animate-spin-slow" />
            <Moon v-else class="h-4 w-4 text-slate-700" />
          </Button>
        </div>
      </div>
    </header>

    <!-- 主體內容區 -->
    <main class="container max-w-7xl mx-auto px-4 mt-6 space-y-6">
      
      <!-- 頂部防呆與數值總覽 -->
      <GlobalSummary />

      <!-- 響應式佈局：手機版採用分頁籤，桌面版直接雙欄展開 -->
      
      <!-- 手機版與平板版分頁籤 (< lg) -->
      <div class="lg:hidden">
        <Tabs default-value="edit" class="w-full">
          <TabsList class="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="edit" class="text-xs">1. 編輯項目</TabsTrigger>
            <TabsTrigger value="allocate" class="text-xs">2. 分配與結果</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" class="mt-4 space-y-6">
            <AssetManager />
            <HeirManager />
          </TabsContent>
          
          <TabsContent value="allocate" class="mt-4 space-y-6">
            <AllocationMatrix />
            <HeirResults />
          </TabsContent>
        </Tabs>
      </div>

      <!-- 桌面版雙欄佈局 (>= lg) -->
      <div class="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        <!-- 左側：資料管理 (資產與繼承人項目) -->
        <div class="col-span-5 space-y-6">
          <div class="flex items-center space-x-2 border-b pb-2">
            <span class="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary h-6 w-6 text-xs font-bold">1</span>
            <h2 class="text-sm font-bold text-slate-700 dark:text-slate-300">建立名單與編輯數值</h2>
          </div>
          <AssetManager />
          <HeirManager />
        </div>

        <!-- 右側：指派與分配結果 -->
        <div class="col-span-7 space-y-6">
          <div class="flex items-center space-x-2 border-b pb-2">
            <span class="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary h-6 w-6 text-xs font-bold">2</span>
            <h2 class="text-sm font-bold text-slate-700 dark:text-slate-300">佔比指派與實時計算結果</h2>
          </div>
          <AllocationMatrix />
          <HeirResults />
        </div>
      </div>
      
    </main>

    <!-- 底部說明欄 -->
    <footer class="container max-w-7xl mx-auto px-4 mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
      <div class="flex items-center justify-center gap-1">
        <Info class="h-3 w-3" />
        <span>本網頁為純前端應用程式，所有計算皆於瀏覽器本地運行。您的個人資料亦僅儲存於本地 localStorage 中。</span>
      </div>
      <p class="mt-1">© 2026 遺產分配試算器 ｜ 財務高精度保障</p>
    </footer>
  </div>
</template>

<style>
/* 簡單的動畫或旋轉效果 */
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
