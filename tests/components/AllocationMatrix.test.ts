import { describe, it, expect, beforeEach } from 'vitest'
import { mount, DOMWrapper } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useInheritanceStore } from '../../src/stores/inheritance'
import AllocationMatrix from '../../src/components/AllocationMatrix.vue'

describe('AllocationMatrix.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Helper function to find input for a specific heir in a decoupled way
  const findInputForHeir = (
    parentWrapper: VueWrapper<any> | DOMWrapper<Element>,
    heirName: string
  ): DOMWrapper<HTMLInputElement> | undefined => {
    const spans = parentWrapper.findAll('span')
    const span = spans.find((s) => s.text().trim() === heirName)
    if (!span) return undefined
    const parentRow = span.element.parentElement
    if (!parentRow) return undefined
    const inputEl = parentRow.querySelector('input')
    return inputEl ? new DOMWrapper<HTMLInputElement>(inputEl) : undefined
  }

  it('shows placeholder if there are no assets', () => {
    const store = useInheritanceStore()
    store.cashList = []
    store.realEstateList = []

    const wrapper = mount(AllocationMatrix)
    expect(wrapper.text()).toContain('請先至左側資產管理頁面新增資產項目')
  })

  it('shows placeholder if there are no heirs but assets exist', () => {
    const store = useInheritanceStore()
    expect(store.cashList.length).toBeGreaterThan(0)
    store.heirList = []

    const wrapper = mount(AllocationMatrix)
    expect(wrapper.text()).toContain('請先至左側繼承人管理頁面新增繼承人')
  })

  it('renders the asset lists and input elements with correct values', () => {
    const store = useInheritanceStore()
    const wrapper = mount(AllocationMatrix)

    // Check header rendering for cash list item
    expect(wrapper.text()).toContain('銀行存款 - 活期台幣')
    expect(wrapper.text()).toContain('已分完') // cash_1 has 1/3 for all 3 heirs, summing to 1

    // Find the card for cash_1
    const cards = wrapper.findAll('[data-slot="card"]')
    const cash1Card = cards.find(c => {
      const h4 = c.find('h4')
      return h4.exists() && h4.text().includes('銀行存款 - 活期台幣')
    })
    expect(cash1Card).toBeDefined()

    // Check input values for heirs under cash_1
    const mingInput = findInputForHeir(cash1Card!, '長子 小明')
    const huaInput = findInputForHeir(cash1Card!, '次子 小華')
    const meiInput = findInputForHeir(cash1Card!, '長女 小美')

    expect(mingInput).toBeDefined()
    expect(mingInput!.element.value).toBe('1/3')
    expect(huaInput).toBeDefined()
    expect(huaInput!.element.value).toBe('1/3')
    expect(meiInput).toBeDefined()
    expect(meiInput!.element.value).toBe('1/3')

    // Find and check real estate card re_1
    const re1Card = cards.find(c => {
      const h4 = c.find('h4')
      return h4.exists() && h4.text().includes('台北大安區電梯大樓')
    })
    expect(re1Card).toBeDefined()
    expect(re1Card!.text()).toContain('已分完')
    expect(re1Card!.text()).toMatch(/(NT)?\$30,000,000/)
    expect(re1Card!.text()).toMatch(/(NT)?\$8,000,000/)

    // Verify inputs for heirs exist under re_1
    const mingReInput = findInputForHeir(re1Card!, '長子 小明')
    const huaReInput = findInputForHeir(re1Card!, '次子 小華')
    const meiReInput = findInputForHeir(re1Card!, '長女 小美')

    expect(mingReInput).toBeDefined()
    expect(mingReInput!.element.value).toBe('1/2')
    expect(huaReInput).toBeDefined()
    expect(huaReInput!.element.value).toBe('')
    expect(meiReInput).toBeDefined()
    expect(meiReInput!.element.value).toBe('1/2')
  })

  it('updates allocation string in store on input change', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AllocationMatrix)

    const cards = wrapper.findAll('[data-slot="card"]')
    const cash1Card = cards.find(c => {
      const h4 = c.find('h4')
      return h4.exists() && h4.text().includes('銀行存款 - 活期台幣')
    })
    expect(cash1Card).toBeDefined()

    const input = findInputForHeir(cash1Card!, '長子 小明')
    expect(input).toBeDefined()
    await input!.setValue('1/2')

    // Check if store allocation was updated
    expect(store.allocations.cash_1.heir_1).toBe('1/2')
  })

  it('renders correct allocation progress badge and progress bar for under-allocated ratio', () => {
    const store = useInheritanceStore()
    store.allocations.cash_1 = { heir_1: '1/4' }

    const wrapper = mount(AllocationMatrix)
    expect(wrapper.text()).toContain('已分配 25.00%')

    const cards = wrapper.findAll('[data-slot="card"]')
    const cash1Card = cards.find(c => {
      const h4 = c.find('h4')
      return h4.exists() && h4.text().includes('銀行存款 - 活期台幣')
    })
    expect(cash1Card).toBeDefined()

    const progressBar = cash1Card!.find('.h-1\\.5 div')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('style')).toContain('width: 25%')
    expect(progressBar.classes()).toContain('bg-emerald-500')
  })

  it('renders correct allocation progress badge and progress bar for over-allocated ratio', () => {
    const store = useInheritanceStore()
    store.allocations.cash_1 = { heir_1: '1', heir_2: '0.5' }

    const wrapper = mount(AllocationMatrix)
    expect(wrapper.text()).toContain('分配超出 100%')

    const cards = wrapper.findAll('[data-slot="card"]')
    const cash1Card = cards.find(c => {
      const h4 = c.find('h4')
      return h4.exists() && h4.text().includes('銀行存款 - 活期台幣')
    })
    expect(cash1Card).toBeDefined()

    const progressBar = cash1Card!.find('.h-1\\.5 div')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('style')).toContain('width: 100%')
    expect(progressBar.classes()).toContain('bg-rose-500')
  })

  it('renders correct allocation progress badge and progress bar for unallocated ratio', () => {
    const store = useInheritanceStore()
    store.allocations.cash_1 = {}

    const wrapper = mount(AllocationMatrix)
    expect(wrapper.text()).toContain('未分配')

    const cards = wrapper.findAll('[data-slot="card"]')
    const cash1Card = cards.find(c => {
      const h4 = c.find('h4')
      return h4.exists() && h4.text().includes('銀行存款 - 活期台幣')
    })
    expect(cash1Card).toBeDefined()

    const progressBar = cash1Card!.find('.h-1\\.5 div')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.attributes('style')).toContain('width: 0%')
    expect(progressBar.classes()).toContain('bg-emerald-500')
  })
})
