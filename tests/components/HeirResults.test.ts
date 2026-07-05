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
    const wrapper = mount(HeirResults)

    // Expected net values display (expected for 1/3 of 41M distributable is 13,666,666.67)
    expect(wrapper.text()).toMatch(/(NT)?\$13,666,667/)

    const cards = wrapper.findAll('[data-slot="card"]')

    // Find and verify heir_1 (小明)
    const heir1Card = cards.find(c => c.text().includes('長子 小明'))
    expect(heir1Card).toBeDefined()
    // Verify border-l color class separately (Decoupled Selector)
    expect(heir1Card!.classes()).toContain('border-l-sky-500')
    // Verify values inside card
    expect(heir1Card!.text()).toContain('預期應得淨值')
    expect(heir1Card!.text()).toMatch(/(NT)?\$13,666,667/)
    expect(heir1Card!.text()).toContain('實際取得資產')
    expect(heir1Card!.text()).toMatch(/(NT)?\$17,666,667/)
    expect(heir1Card!.text()).toContain('實際承接債務')
    expect(heir1Card!.text()).toMatch(/(NT)?\$4,000,000/)
    expect(heir1Card!.text()).toContain('實際分配淨值')
    expect(heir1Card!.text()).toMatch(/(NT)?\$13,666,667/)
    // Difference badge
    expect(heir1Card!.text()).toMatch(/短領：-(NT)?\$1,500,000/)

    // Find and verify heir_2 (小華)
    const heir2Card = cards.find(c => c.text().includes('次子 小華'))
    expect(heir2Card).toBeDefined()
    // Verify border-l color class separately
    expect(heir2Card!.classes()).toContain('border-l-amber-500')
    // Verify values inside card
    expect(heir2Card!.text()).toMatch(/(NT)?\$15,666,667/) // actual net value
    // Difference badge
    expect(heir2Card!.text()).toMatch(/溢領：\+(NT)?\$2,000,000/)

    // Find and verify heir_3 (小美)
    const heir3Card = cards.find(c => c.text().includes('長女 小美'))
    expect(heir3Card).toBeDefined()
    // Verify border-l color class separately
    expect(heir3Card!.classes()).toContain('border-l-emerald-500')
    // Difference badge
    expect(heir3Card!.text()).toContain('已達平衡額 (0)')
  })

  it('renders common expense distribution details correctly', () => {
    const wrapper = mount(HeirResults)

    const cards = wrapper.findAll('[data-slot="card"]')

    // heir_1 (小明) prepaid exp_1: check pre-payer adjustment alert and recovery amount
    const heir1Card = cards.find(c => c.text().includes('長子 小明'))
    expect(heir1Card).toBeDefined()
    expect(heir1Card!.text()).toMatch(/已預付全額，差額調整：－(NT)?\$1,500,000/)
    expect(heir1Card!.text()).toMatch(/＋可收回：(NT)?\$1,000,000/)

    // heir_2 has to pay other prepaid: check deduction details
    const heir2Card = cards.find(c => c.text().includes('次子 小華'))
    expect(heir2Card).toBeDefined()
    expect(heir2Card!.text()).toMatch(/－需補付：(NT)?\$500,000/)

    // heir_3 has to pay other prepaid: check deduction details
    const heir3Card = cards.find(c => c.text().includes('長女 小美'))
    expect(heir3Card).toBeDefined()
    expect(heir3Card!.text()).toMatch(/－需補付：(NT)?\$500,000/)
  })

  it('renders mortgage monthly payments estimations when heir inherits debt', () => {
    const wrapper = mount(HeirResults)

    const cards = wrapper.findAll('[data-slot="card"]')

    // heir_2 (小華) inherits re_2 (15M value, 2M mortgage, 2.25% rate)
    const heir2Card = cards.find(c => c.text().includes('次子 小華'))
    expect(heir2Card).toBeDefined()
    
    // Check if mortgage trial section is displayed
    expect(heir2Card!.text()).toContain('承接房貸負擔月還款試算')
    expect(heir2Card!.text()).toContain('20 年期貸款')
    expect(heir2Card!.text()).toContain('10,356 元/月')
    expect(heir2Card!.text()).toContain('30 年期貸款')
    expect(heir2Card!.text()).toContain('7,645 元/月')
    expect(heir2Card!.text()).toContain('40 年期貸款')
    expect(heir2Card!.text()).toContain('6,323 元/月')
    expect(heir2Card!.text()).toContain('3,750 元/月') // Interest only (2M * 2.25% / 12)
  })

  it('does not render mortgage monthly payments estimations when heir inherits no debt', () => {
    const store = useInheritanceStore()
    // Remove real estate allocation for heir_3 (小美)
    store.updateAllocation('re_1', 'heir_3', '')

    const wrapper = mount(HeirResults)
    const cards = wrapper.findAll('[data-slot="card"]')

    const heir3Card = cards.find(c => c.text().includes('長女 小美'))
    expect(heir3Card).toBeDefined()
    expect(heir3Card!.text()).not.toContain('承接房貸負擔月還款試算')
  })
})
