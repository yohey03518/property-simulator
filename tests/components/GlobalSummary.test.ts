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

    // Total Assets: NT$53,000,000 or $53,000,000 (from default setup)
    expect(wrapper.text()).toMatch(/(NT)?\$53,000,000/)
    // Total Liabilities: NT$10,000,000 or $10,000,000
    expect(wrapper.text()).toMatch(/(NT)?\$10,000,000/)
    // Common Expenses: NT$2,000,000 or $2,000,000
    expect(wrapper.text()).toMatch(/(NT)?\$2,000,000/)
    // Net Distributable: NT$41,000,000 or $41,000,000
    expect(wrapper.text()).toMatch(/(NT)?\$41,000,000/)
  })

  it('shows balanced state when totalUndistributedNetValue is 0', () => {
    const store = useInheritanceStore()
    store.resetToDefault()

    const wrapper = mount(GlobalSummary)

    expect(wrapper.text()).toContain('已完全分配完畢')
    // Verify that the banner is green (emerald background)
    const banner = wrapper.find('.rounded-lg')
    expect(banner.classes()).toContain('bg-emerald-50')
  })

  it('shows under-allocated state when totalUndistributedNetValue is positive', () => {
    const store = useInheritanceStore()
    store.resetToDefault()

    // Set allocation to 0 to simulate unallocated assets
    store.allocations = {}

    const wrapper = mount(GlobalSummary)

    expect(wrapper.text()).toContain('尚有資產未指派')
    expect(wrapper.text()).toMatch(/(NT)?\$43,000,000/) // 53M - 10M
    // Verify that the banner is amber
    const banner = wrapper.find('.rounded-lg')
    expect(banner.classes()).toContain('bg-amber-50')
  })

  it('shows over-allocated state when totalUndistributedNetValue is negative', () => {
    const store = useInheritanceStore()
    store.resetToDefault()

    // Assign extra allocation ratio to exceed 100%
    store.allocations.cash_1 = { heir_1: '2', heir_2: '1' }

    const wrapper = mount(GlobalSummary)

    expect(wrapper.text()).toContain('分配超出總淨額')
    // Verify that the banner is rose/red
    const banner = wrapper.find('.rounded-lg')
    expect(banner.classes()).toContain('bg-rose-50')
  })

  it('correctly handles float precision issues without showing warnings', () => {
    const store = useInheritanceStore()
    store.resetToDefault()

    // The default setup distributes assets fully using '1/3' which has precision residual of around -1e-15 TWD.
    // Verify totalUndistributedNetValue is exactly 0 and it shows balanced.
    expect(store.totalUndistributedNetValue.isZero()).toBe(true)

    const wrapper = mount(GlobalSummary)
    expect(wrapper.text()).toContain('已完全分配完畢')
    expect(wrapper.text()).not.toContain('分配超出總淨額')
  })
})
