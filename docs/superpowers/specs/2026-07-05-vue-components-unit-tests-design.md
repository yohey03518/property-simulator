# Vue Components Unit Tests Design Spec

This document details the plan to introduce comprehensive unit tests for the Vue 3 components of the **遺產分配與房貸負擔試算器** (Property Simulator) application.

## 1. Objectives & Testing Scope
The primary goal is to ensure all core user interactions, calculations, status indicators, and validations are fully covered by unit tests, preventing regressions.

We will test the following 5 core Vue components:
1. `GlobalSummary.vue` (Numerical summary & allocation status banner)
2. `AssetManager.vue` (Adding, editing, and deleting cash, real estates, and common expenses)
3. `HeirManager.vue` (Adding, editing, and deleting heirs, with ratio validation)
4. `AllocationMatrix.vue` (Assigning ratios to heirs, progress bars, and over-allocation warning badges)
5. `HeirResults.vue` (Expected/actual net value differences, common expense details, and mortgage calculators)

---

## 2. Testing Environment & Strategy
* **Testing Framework**: Vitest
* **DOM Environment**: `jsdom`
* **Vue Test Utility**: `@vue/test-utils`
* **Pinia Integration**:
  - We use real Pinia stores initialized with `createPinia()` and set active with `setActivePinia()` before each test to validate actual data flow.
  - Stubs will be used for nested Lucide icons or other framework UI components if needed.

---

## 3. Test Scenarios by Component

### 3.1 GlobalSummary.vue
* **Scenario 1: Summary Calculation Rendering**
  - Verify that the four key cards display the correctly formatted currency values representing:
    - Total Assets (`totalAssets`)
    - Total Liabilities (`totalLiabilities`)
    - Common Expenses (`totalCommonExpenses`)
    - Net Distributable Value (`netDistributableValue`)
* **Scenario 2: Balanced Status Warning Banner**
  - When `totalUndistributedNetValue` is `0`, verify that the banner shows `"已完全分配完畢"` with emerald colors.
* **Scenario 3: Under-allocated Status Warning Banner**
  - When `totalUndistributedNetValue` is greater than `0`, verify that the banner shows `"尚有資產未指派 (TWD...)"` with amber colors.
* **Scenario 4: Over-allocated Status Warning Banner**
  - When `totalUndistributedNetValue` is less than `0`, verify that the banner shows `"分配超出總淨額 (TWD...)"` with rose/red colors.

### 3.2 AssetManager.vue
* **Scenario 1: List Rendering**
  - Verify lists of cash, real estates, and common expenses are correctly retrieved from the store and displayed.
* **Scenario 2: Cash Operations**
  - Click "新增現金" -> fill inputs -> click "儲存" -> check item added to store.
  - Click "編輯" on cash item -> update amount -> click "儲存" -> check item updated in store.
  - Click "刪除" on cash item -> check item removed from store.
* **Scenario 3: Real Estate Operations**
  - Click "新增房產" -> fill name, value, mortgage, rate -> click "儲存" -> check item added.
  - Click "編輯" -> update mortgage -> click "儲存" -> check item updated.
  - Click "刪除" -> check item removed.
* **Scenario 4: Common Expense Operations**
  - Verify "預先支付者" dropdown shows all heirs + sentinel option `"未指定"`.
  - Add expense with pre-payer, verify `paidByHeirId` is saved.
  - Add expense without pre-payer, verify `paidByHeirId` is saved as `undefined` (handling sentinel value `"__none__"` conversion).
  - Edit and delete common expenses, checking store state.

### 3.3 HeirManager.vue
* **Scenario 1: Heir List Rendering**
  - Verify list of heirs is correctly loaded and displayed.
* **Scenario 2: Real-time Share Input Validation**
  - Input `"1/3"` -> verify parsed preview reads `"解析結果：將分配總淨值的 33.33%"`.
  - Input `"50%"` -> verify parsed preview reads `"解析結果：將分配總淨值的 50.00%"`.
  - Input `"0.25"` -> verify parsed preview reads `"解析結果：將分配總淨值的 25.00%"`.
  - Input `"abc"` -> verify warning text `"輸入格式有誤，將視為 0% 進行運算"`.
* **Scenario 3: Add / Edit / Delete Heirs**
  - Add a new heir, verify added to store list.
  - Edit heir name/ratio, verify updated.
  - Delete heir, verify removed and that their allocations are cleaned up.

### 3.4 AllocationMatrix.vue
* **Scenario 1: Empty Placeholder**
  - Verify placeholder messages if no assets or no heirs exist.
* **Scenario 2: Grid Input Binding**
  - Verify that each cell in the grid displays the correct allocation ratio string.
  - Triggering input update on any cell calls `store.updateAllocation`.
* **Scenario 3: Asset Allocation Progress and Badges**
  - Total allocation ratio = 1.0 (100%): badge displays `"已分完"`.
  - Total allocation ratio > 1.0 (>100%): badge displays `"分配超出 100%"`.
  - Total allocation ratio < 1.0 and > 0: badge displays `"已分配 XX.XX%"`.
  - Total allocation ratio = 0: badge displays `"未分配"`.

### 3.5 HeirResults.vue
* **Scenario 1: Empty Placeholder**
  - Verify placeholder displays if no heirs are added.
* **Scenario 2: Summary Cards by Heir**
  - Verify rendering of card showing target ratio, expected net value, actual assets, actual liabilities, actual net value, and difference.
* **Scenario 3: Difference Status Badges**
  - Difference = 0: badge displays `"已達平衡額 (0)"`.
  - Difference > 0: badge displays `"溢領：+NT$... (需補償他人)"`.
  - Difference < 0: badge displays `"短領：-NT$... (應獲他人補償)"`.
* **Scenario 4: Expense Allocation Details**
  - Verify table details for common expenses showing personal shares.
  - Prepaid item for the heir: displays `"＋可收回：NT$..."`.
  - Prepaid item by others: displays `"－需補付：NT$..."`.
  - Prepaid item adjustment alert: displays `"已預付全額，差額調整：－NT$..."`.
* **Scenario 5: Mortgage Loan Calculator**
  - Verify mortgage monthly payment estimations for 20, 30, and 40 years are calculated correctly for heirs inheriting property debt.

---

## 5. Verification Plan
* Run all tests via `pnpm test` or `npx vitest run`.
* Verify 100% pass status of all tests.
