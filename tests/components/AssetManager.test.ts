import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useInheritanceStore } from '../../src/stores/inheritance'
import AssetManager from '../../src/components/AssetManager.vue'
import { Select } from '../../src/components/ui/select'
import { Edit2, Trash2 } from 'lucide-vue-next'

describe('AssetManager.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the lists of assets and expenses correctly', () => {
    const wrapper = mount(AssetManager)

    expect(wrapper.text()).toContain('銀行存款 - 活期台幣')
    expect(wrapper.text()).toContain('台北大安區電梯大樓')
    expect(wrapper.text()).toContain('預估遺產稅')
  })

  // --- 現金與動產測試 ---
  it('adds a cash asset correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const cashCard = cards.find(card => card.text().includes('現金與動產清單'))
    expect(cashCard).toBeDefined()

    // Click Add Cash
    const addBtn = cashCard!.findAll('button').find(b => b.text().includes('新增現金'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    // Fill form inputs
    const inputs = cashCard!.findAll('input')
    // Name input
    await inputs[0].setValue('美金定存')
    // Amount input
    await inputs[1].setValue(1200000)

    // Click save button (the second button in the form container)
    const saveBtn = cashCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    // Verify item was added to store using find
    expect(store.cashList.find(c => c.name === '美金定存' && c.amount === 1200000)).toBeDefined()
  })

  it('edits a cash asset correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const cashCard = cards.find(card => card.text().includes('現金與動產清單'))
    expect(cashCard).toBeDefined()

    // Find first cash card edit button using Edit2 component
    const editIcon = cashCard!.findComponent(Edit2)
    expect(editIcon.exists()).toBe(true)
    await editIcon.trigger('click')

    const inputs = cashCard!.findAll('input')
    await inputs[0].setValue('修改後的現金')
    await inputs[1].setValue(99999)

    const saveBtn = cashCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    expect(store.cashList[0].name).toBe('修改後的現金')
    expect(store.cashList[0].amount).toBe(99999)
  })

  it('deletes a cash asset correctly', async () => {
    const store = useInheritanceStore()
    const initialLength = store.cashList.length

    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const cashCard = cards.find(card => card.text().includes('現金與動產清單'))
    expect(cashCard).toBeDefined()

    // Find delete button using Trash2 component
    const deleteIcon = cashCard!.findComponent(Trash2)
    expect(deleteIcon.exists()).toBe(true)
    await deleteIcon.trigger('click')

    expect(store.cashList.length).toBe(initialLength - 1)
  })

  // --- 房產與不動產測試 ---
  it('adds a real estate asset correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const reCard = cards.find(card => card.text().includes('房產與不動產清單'))
    expect(reCard).toBeDefined()

    // Click Add Real Estate
    const addBtn = reCard!.findAll('button').find(b => b.text().includes('新增房產'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    // Fill form inputs (name, value, mortgage, rate)
    const inputs = reCard!.findAll('input')
    await inputs[0].setValue('台中透天厝')
    await inputs[1].setValue(20000000)
    await inputs[2].setValue(5000000)
    await inputs[3].setValue(2.3)

    // Click save button
    const saveBtn = reCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    // Verify item was added to store
    const addedItem = store.realEstateList.find(r => r.name === '台中透天厝')
    expect(addedItem).toBeDefined()
    expect(addedItem?.value).toBe(20000000)
    expect(addedItem?.mortgage).toBe(5000000)
    expect(addedItem?.rate).toBe(2.3)
  })

  it('edits a real estate asset correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const reCard = cards.find(card => card.text().includes('房產與不動產清單'))
    expect(reCard).toBeDefined()

    // Find first real estate card edit button using Edit2 component
    const editIcon = reCard!.findComponent(Edit2)
    expect(editIcon.exists()).toBe(true)
    await editIcon.trigger('click')

    const inputs = reCard!.findAll('input')
    await inputs[0].setValue('修改後的房產')
    await inputs[1].setValue(15000000)
    await inputs[2].setValue(1000000)
    await inputs[3].setValue(1.8)

    const saveBtn = reCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    expect(store.realEstateList[0].name).toBe('修改後的房產')
    expect(store.realEstateList[0].value).toBe(15000000)
    expect(store.realEstateList[0].mortgage).toBe(1000000)
    expect(store.realEstateList[0].rate).toBe(1.8)
  })

  it('deletes a real estate asset correctly', async () => {
    const store = useInheritanceStore()
    const initialLength = store.realEstateList.length

    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const reCard = cards.find(card => card.text().includes('房產與不動產清單'))
    expect(reCard).toBeDefined()

    // Find delete button using Trash2 component
    const deleteIcon = reCard!.findComponent(Trash2)
    expect(deleteIcon.exists()).toBe(true)
    await deleteIcon.trigger('click')

    expect(store.realEstateList.length).toBe(initialLength - 1)
  })

  // --- 共同支出與稅費測試 ---
  it('adds a common expense correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const expCard = cards.find(card => card.text().includes('共同支出與稅費'))
    expect(expCard).toBeDefined()

    // Click Add Expense
    const addBtn = expCard!.findAll('button').find(b => b.text().includes('新增支出'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    // Fill form inputs (name, amount)
    const inputs = expCard!.findAll('input')
    await inputs[0].setValue('律師公證費')
    await inputs[1].setValue(150000)

    // Click save button
    const saveBtn = expCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    // Verify item was added to store
    const addedItem = store.commonExpenseList.find(e => e.name === '律師公證費')
    expect(addedItem).toBeDefined()
    expect(addedItem?.amount).toBe(150000)
    expect(addedItem?.paidByHeirId).toBeUndefined()
  })

  it('adds a common expense with a pre-paid heir correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const expCard = cards.find(card => card.text().includes('共同支出與稅費'))
    expect(expCard).toBeDefined()

    // Click Add Expense
    const addBtn = expCard!.findAll('button').find(b => b.text().includes('新增支出'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    // Fill form inputs
    const inputs = expCard!.findAll('input')
    await inputs[0].setValue('規費')
    await inputs[1].setValue(20000)

    // Trigger select update to set the heir ID
    const select = expCard!.findComponent(Select)
    expect(select.exists()).toBe(true)
    await select.vm.$emit('update:modelValue', 'heir_2')

    // Click save button
    const saveBtn = expCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    // Verify item was added to store
    const addedItem = store.commonExpenseList.find(e => e.name === '規費')
    expect(addedItem).toBeDefined()
    expect(addedItem?.amount).toBe(20000)
    expect(addedItem?.paidByHeirId).toBe('heir_2')
  })

  it('edits a common expense correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const expCard = cards.find(card => card.text().includes('共同支出與稅費'))
    expect(expCard).toBeDefined()

    // Find first expense card edit button using Edit2 component
    const editIcon = expCard!.findComponent(Edit2)
    expect(editIcon.exists()).toBe(true)
    await editIcon.trigger('click')

    const inputs = expCard!.findAll('input')
    await inputs[0].setValue('修改後的支出')
    await inputs[1].setValue(60000)

    // Set payer to heir_3
    const select = expCard!.findComponent(Select)
    expect(select.exists()).toBe(true)
    await select.vm.$emit('update:modelValue', 'heir_3')

    const saveBtn = expCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    expect(store.commonExpenseList[0].name).toBe('修改後的支出')
    expect(store.commonExpenseList[0].amount).toBe(60000)
    expect(store.commonExpenseList[0].paidByHeirId).toBe('heir_3')
  })

  it('maps the sentinel value "__none__" for pre-paid heir to undefined in store', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const expCard = cards.find(card => card.text().includes('共同支出與稅費'))
    expect(expCard).toBeDefined()

    // Find first expense card edit button using Edit2 component
    const editIcon = expCard!.findComponent(Edit2)
    expect(editIcon.exists()).toBe(true)
    await editIcon.trigger('click')

    // Verify it initially has heir_1
    expect(store.commonExpenseList[0].paidByHeirId).toBe('heir_1')

    // Change to '__none__'
    const select = expCard!.findComponent(Select)
    expect(select.exists()).toBe(true)
    await select.vm.$emit('update:modelValue', '__none__')

    const saveBtn = expCard!.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    // Verify it was updated to undefined
    expect(store.commonExpenseList[0].paidByHeirId).toBeUndefined()
  })

  it('deletes a common expense correctly', async () => {
    const store = useInheritanceStore()
    const initialLength = store.commonExpenseList.length

    const wrapper = mount(AssetManager)

    const cards = wrapper.findAll('[data-slot="card"]')
    const expCard = cards.find(card => card.text().includes('共同支出與稅費'))
    expect(expCard).toBeDefined()

    // Find delete button using Trash2 component
    const deleteIcon = expCard!.findComponent(Trash2)
    expect(deleteIcon.exists()).toBe(true)
    await deleteIcon.trigger('click')

    expect(store.commonExpenseList.length).toBe(initialLength - 1)
  })

  // --- 表單驗證測試 ---
  describe('Form Validation Guards', () => {
    it('disables save button and rejects save for cash when name is empty or amount is negative', async () => {
      const store = useInheritanceStore()
      const initialLength = store.cashList.length
      const wrapper = mount(AssetManager)
      const cards = wrapper.findAll('[data-slot="card"]')
      const cashCard = cards.find(card => card.text().includes('現金與動產清單'))!

      // Open add form
      const addBtn = cashCard.findAll('button').find(b => b.text().includes('新增現金'))!
      await addBtn.trigger('click')

      const inputs = cashCard.findAll('input')
      const saveBtn = cashCard.findAll('button').find(b => b.text().includes('儲存'))!

      // Case 1: Empty name
      await inputs[0].setValue('')
      await inputs[1].setValue(100)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      // Directly trigger save click to verify guard clause
      await saveBtn.trigger('click')
      expect(store.cashList.length).toBe(initialLength)

      // Case 2: Negative amount
      await inputs[0].setValue('有效名稱')
      await inputs[1].setValue(-50)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.cashList.length).toBe(initialLength)
    })

    it('disables save button and rejects save for real estate when fields are invalid', async () => {
      const store = useInheritanceStore()
      const initialLength = store.realEstateList.length
      const wrapper = mount(AssetManager)
      const cards = wrapper.findAll('[data-slot="card"]')
      const reCard = cards.find(card => card.text().includes('房產與不動產清單'))!

      // Open add form
      const addBtn = reCard.findAll('button').find(b => b.text().includes('新增房產'))!
      await addBtn.trigger('click')

      const inputs = reCard.findAll('input')
      const saveBtn = reCard.findAll('button').find(b => b.text().includes('儲存'))!

      // Case 1: Empty name
      await inputs[0].setValue('')
      await inputs[1].setValue(1000)
      await inputs[2].setValue(200)
      await inputs[3].setValue(2.0)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.realEstateList.length).toBe(initialLength)

      // Case 2: Negative value
      await inputs[0].setValue('有效房產')
      await inputs[1].setValue(-1000)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.realEstateList.length).toBe(initialLength)

      // Case 3: Negative mortgage
      await inputs[1].setValue(1000)
      await inputs[2].setValue(-200)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.realEstateList.length).toBe(initialLength)

      // Case 4: Negative interest rate
      await inputs[2].setValue(200)
      await inputs[3].setValue(-1.5)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.realEstateList.length).toBe(initialLength)
    })

    it('disables save button and rejects save for common expense when fields are invalid', async () => {
      const store = useInheritanceStore()
      const initialLength = store.commonExpenseList.length
      const wrapper = mount(AssetManager)
      const cards = wrapper.findAll('[data-slot="card"]')
      const expCard = cards.find(card => card.text().includes('共同支出與稅費'))!

      // Open add form
      const addBtn = expCard.findAll('button').find(b => b.text().includes('新增支出'))!
      await addBtn.trigger('click')

      const inputs = expCard.findAll('input')
      const saveBtn = expCard.findAll('button').find(b => b.text().includes('儲存'))!

      // Case 1: Empty name
      await inputs[0].setValue('')
      await inputs[1].setValue(500)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.commonExpenseList.length).toBe(initialLength)

      // Case 2: Negative amount
      await inputs[0].setValue('有效支出')
      await inputs[1].setValue(-100)
      expect(saveBtn.attributes('disabled')).toBeDefined()
      await saveBtn.trigger('click')
      expect(store.commonExpenseList.length).toBe(initialLength)
    })
  })
})
