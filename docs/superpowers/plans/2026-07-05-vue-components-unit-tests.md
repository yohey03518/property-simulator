# Vue Components Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete and robust unit tests for all 5 core Vue components of the inheritance simulator.

**Architecture:** Use Vitest, jsdom, and `@vue/test-utils` to mount each component. Initialize and populate a real Pinia store instance before each test to verify correct data bindings, user interactions (adding, editing, deleting items), and reactive calculations.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, jsdom, `@vue/test-utils`

---

### Task 1: GlobalSummary.vue unit tests

**Files:**
- Create: `tests/components/GlobalSummary.test.ts`

- [ ] **Step 1: Write the tests for GlobalSummary.vue**
  Create `tests/components/GlobalSummary.test.ts` with test logic verifying currency format rendering and the warning banners for all three allocation states (balanced, under-allocated, and over-allocated).
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createPinia, setActivePinia } from 'pinia'
  import { useInheritanceStore } from '../../src/stores/inheritance'
  import GlobalSummary from '../../src/components/GlobalSummary.vue'
  import { Decimal } from 'decimal.js'

  describe('GlobalSummary.vue', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('renders the formatted currency indicators correctly based on store state', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(GlobalSummary)

      // Total Assets: NT$53,000,000 (from default setup)
      expect(wrapper.text()).toContain('NT$53,000,000')
      // Total Liabilities: NT$10,000,000
      expect(wrapper.text()).toContain('NT$10,000,000')
      // Common Expenses: NT$2,000,000
      expect(wrapper.text()).toContain('NT$2,000,000')
      // Net Distributable: NT$41,000,000
      expect(wrapper.text()).toContain('NT$41,000,000')
    })

    it('shows balanced state when totalUndistributedNetValue is 0', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(GlobalSummary)

      expect(wrapper.text()).toContain('已完全分配完畢')
    })

    it('shows under-allocated state when totalUndistributedNetValue is positive', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      // Set allocation to 0 to simulate unallocated assets
      store.allocations = {}

      const wrapper = mount(GlobalSummary)

      expect(wrapper.text()).toContain('尚有資產未指派')
      expect(wrapper.text()).toContain('NT$43,000,000') // 53M - 10M
    })

    it('shows over-allocated state when totalUndistributedNetValue is negative', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      // Assign extra allocation ratio to exceed 100%
      store.allocations.cash_1 = { heir_1: '2', heir_2: '1' }

      const wrapper = mount(GlobalSummary)

      expect(wrapper.text()).toContain('分配超出總淨額')
    })
  })
  ```

- [ ] **Step 2: Run the test suite and verify they pass**
  Run: `npx vitest run tests/components/GlobalSummary.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add tests/components/GlobalSummary.test.ts
  git commit -m "test: add GlobalSummary component unit tests"
  ```

---

### Task 2: AssetManager.vue unit tests

**Files:**
- Create: `tests/components/AssetManager.test.ts`

- [ ] **Step 1: Write the tests for AssetManager.vue**
  Create `tests/components/AssetManager.test.ts` to verify the list displays cash, real estates, and common expenses, and covers full adding, editing, and deleting flows.
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createPinia, setActivePinia } from 'pinia'
  import { useInheritanceStore } from '../../src/stores/inheritance'
  import AssetManager from '../../src/components/AssetManager.vue'

  describe('AssetManager.vue', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('renders the lists of assets and expenses correctly', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(AssetManager)

      expect(wrapper.text()).toContain('銀行存款 - 活期台幣')
      expect(wrapper.text()).toContain('台北大安區電梯大樓')
      expect(wrapper.text()).toContain('預估遺產稅')
    })

    it('adds a cash asset correctly', async () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(AssetManager)

      // Click Add Cash
      const addBtn = wrapper.find('button') // First button in header is "新增現金"
      await addBtn.trigger('click')

      // Fill form inputs
      const inputs = wrapper.findAll('input')
      // Name input
      await inputs[0].setValue('美金定存')
      // Amount input
      await inputs[1].setValue(1200000)

      // Click save button (the second button in the form container)
      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
      await saveBtn?.trigger('click')

      // Verify item was added to store
      expect(store.cashList.some(c => c.name === '美金定存' && c.amount === 1200000)).toBe(true)
    })

    it('edits a cash asset correctly', async () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(AssetManager)

      // Find first cash card edit button
      const editBtn = wrapper.find('button[class*="hover:text-primary"]')
      await editBtn.trigger('click')

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('修改後的現金')
      await inputs[1].setValue(99999)

      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
      await saveBtn?.trigger('click')

      expect(store.cashList[0].name).toBe('修改後的現金')
      expect(store.cashList[0].amount).toBe(99999)
    })

    it('deletes a cash asset correctly', async () => {
      const store = useInheritanceStore()
      store.resetToDefault()
      const initialLength = store.cashList.length

      const wrapper = mount(AssetManager)

      // Find delete button (hover:text-destructive)
      const deleteBtn = wrapper.find('button[class*="hover:text-destructive"]')
      await deleteBtn.trigger('click')

      expect(store.cashList.length).toBe(initialLength - 1)
    })
  })
  ```

- [ ] **Step 2: Run the test suite and verify they pass**
  Run: `npx vitest run tests/components/AssetManager.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add tests/components/AssetManager.test.ts
  git commit -m "test: add AssetManager component unit tests"
  ```

---

### Task 3: HeirManager.vue unit tests

**Files:**
- Create: `tests/components/HeirManager.test.ts`

- [ ] **Step 1: Write the tests for HeirManager.vue**
  Create `tests/components/HeirManager.test.ts` covering heir listings, target ratio string validation previews, and full CRUD operations.
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createPinia, setActivePinia } from 'pinia'
  import { useInheritanceStore } from '../../src/stores/inheritance'
  import HeirManager from '../../src/components/HeirManager.vue'

  describe('HeirManager.vue', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('renders the heirs list from store', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(HeirManager)

      expect(wrapper.text()).toContain('長子 小明')
      expect(wrapper.text()).toContain('目標持份：1/3 (33.33%)')
    })

    it('updates parsed target share ratio preview in real-time', async () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(HeirManager)

      // Open Add Heir Form
      const addBtn = wrapper.find('button')
      await addBtn.trigger('click')

      const inputs = wrapper.findAll('input')
      const ratioInput = inputs[1]

      // Case 1: Fraction "1/2"
      await ratioInput.setValue('1/2')
      expect(wrapper.text()).toContain('將分配總淨值的 50.00%')

      // Case 2: Percentage "25%"
      await ratioInput.setValue('25%')
      expect(wrapper.text()).toContain('將分配總淨值的 25.00%')

      // Case 3: Invalid
      await ratioInput.setValue('invalid')
      expect(wrapper.text()).toContain('輸入格式有誤，將視為 0% 進行運算')
    })

    it('adds and deletes a heir correctly', async () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(HeirManager)

      // Add heir
      const addBtn = wrapper.find('button')
      await addBtn.trigger('click')

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('四子 小強')
      await inputs[1].setValue('1/4')

      const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
      await saveBtn?.trigger('click')

      expect(store.heirList.some(h => h.name === '四子 小強')).toBe(true)

      // Delete heir
      const deleteBtn = wrapper.findAll('button[class*="hover:text-destructive"]').at(-1)
      await deleteBtn?.trigger('click')

      expect(store.heirList.some(h => h.name === '四子 小強')).toBe(false)
    })
  })
  ```

- [ ] **Step 2: Run the test suite and verify they pass**
  Run: `npx vitest run tests/components/HeirManager.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add tests/components/HeirManager.test.ts
  git commit -m "test: add HeirManager component unit tests"
  ```

---

### Task 4: AllocationMatrix.vue unit tests

**Files:**
- Create: `tests/components/AllocationMatrix.test.ts`

- [ ] **Step 1: Write the tests for AllocationMatrix.vue**
  Create `tests/components/AllocationMatrix.test.ts` to test display states based on allocation percentages and grid input event emissions.
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createPinia, setActivePinia } from 'pinia'
  import { useInheritanceStore } from '../../src/stores/inheritance'
  import AllocationMatrix from '../../src/components/AllocationMatrix.vue'

  describe('AllocationMatrix.vue', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('shows placeholders if there are no assets or heirs', () => {
      const store = useInheritanceStore()
      store.cashList = []
      store.realEstateList = []

      const wrapper = mount(AllocationMatrix)
      expect(wrapper.text()).toContain('請先至左側資產管理頁面新增資產項目')
    })

    it('renders the asset lists and input elements with correct values', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(AllocationMatrix)

      // Check header rendering for cash list item
      expect(wrapper.text()).toContain('銀行存款 - 活期台幣')
      expect(wrapper.text()).toContain('已分完') // cash_1 has 1/3 for all 3 heirs, summing to 1

      // Check re_1 progress badge
      expect(wrapper.text()).toContain('已分完') // re_1 is 1/2 for heir_1 and heir_3, summing to 1
    })

    it('updates allocation string in store on input change', async () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(AllocationMatrix)

      // Find the first allocation input field
      const input = wrapper.find('input')
      await input.setValue('1/2')

      // Check if store allocation was updated
      // First input is cash_1 for heir_1
      expect(store.allocations.cash_1.heir_1).toBe('1/2')
    })

    it('renders correct allocation progress badge depending on allocation ratio', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      // Scenario 1: Under-allocated
      store.allocations.cash_1 = { heir_1: '1/4' }
      let wrapper = mount(AllocationMatrix)
      expect(wrapper.text()).toContain('已分配 25.00%')

      // Scenario 2: Over-allocated
      store.allocations.cash_1 = { heir_1: '1', heir_2: '0.5' }
      wrapper = mount(AllocationMatrix)
      expect(wrapper.text()).toContain('分配超出 100%')

      // Scenario 3: Unallocated
      store.allocations.cash_1 = {}
      wrapper = mount(AllocationMatrix)
      expect(wrapper.text()).toContain('未分配')
    })
  })
  ```

- [ ] **Step 2: Run the test suite and verify they pass**
  Run: `npx vitest run tests/components/AllocationMatrix.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add tests/components/AllocationMatrix.test.ts
  git commit -m "test: add AllocationMatrix component unit tests"
  ```

---

### Task 5: HeirResults.vue unit tests

**Files:**
- Create: `tests/components/HeirResults.test.ts`

- [ ] **Step 1: Write the tests for HeirResults.vue**
  Create `tests/components/HeirResults.test.ts` covering cards for heirs, expected/actual net values, prepaid common expense details, and mortgage estimates.
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { mount } from '@vue/test-utils'
  import { createPinia, setActivePinia } from 'pinia'
  import { useInheritanceStore } from '../../src/stores/inheritance'
  import HeirResults from '../../src/components/HeirResults.vue'

  describe('HeirResults.vue', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('shows placeholder when heirList is empty', () => {
      const store = useInheritanceStore()
      store.heirList = []

      const wrapper = mount(HeirResults)
      expect(wrapper.text()).toContain('請先於左側面板新增繼承人。')
    })

    it('renders expected net values and difference badges correctly', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(HeirResults)

      // Expected net values display
      expect(wrapper.text()).toContain('NT$13,666,667') // expected for 1/3 of 41M distributable

      // Differences badges
      // heir_1 difference should be -1.5M (short領)
      expect(wrapper.text()).toContain('短領：-NT$1,500,000')
      // heir_2 difference should be +2M (溢領)
      expect(wrapper.text()).toContain('溢領：+NT$2,000,000')
      // heir_3 difference should be 0
      expect(wrapper.text()).toContain('已達平衡額 (0)')
    })

    it('renders common expense distribution details correctly', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(HeirResults)

      // heir_1 prepaid exp_1: check pre-payer adjustment alert and recovery amount
      expect(wrapper.text()).toContain('已預付全額，差額調整：－NT$1,500,000')
      expect(wrapper.text()).toContain('＋可收回：NT$1,000,000')

      // heir_2 has to pay other prepaid: check deduction details
      expect(wrapper.text()).toContain('－需補付：NT$500,000')
    })

    it('renders mortgage monthly payments estimations when heir inherits debt', () => {
      const store = useInheritanceStore()
      store.resetToDefault()

      const wrapper = mount(HeirResults)

      // heir_2 inherits re_2 (15M value, 2M mortgage, 2.25% rate)
      // Check if mortgage trial section is displayed for heir_2
      expect(wrapper.text()).toContain('承接房貸負擔月還款試算')
      // Check 30-year principal and interest payments estimation for 2M mortgage
      expect(wrapper.text()).toContain('7,645 元/月') // 2000000 at 2.25% for 30 years
    })
  })
  ```

- [ ] **Step 2: Run the test suite and verify they pass**
  Run: `npx vitest run tests/components/HeirResults.test.ts`
  Expected: PASS

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add tests/components/HeirResults.test.ts
  git commit -m "test: add HeirResults component unit tests"
  ```

---

### Task 6: Final Verification

**Files:**
- Modify: `package.json:10`

- [ ] **Step 1: Check that all tests pass**
  Run: `pnpm test`
  Expected: All 5 test files (and `utils.test.ts`) pass.

- [ ] **Step 2: Build the project**
  Run: `pnpm build`
  Expected: Successful production build with type checks passing.

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git commit --allow-empty -m "test: verify all component unit tests pass successfully"
  ```
