import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useInheritanceStore } from '../../src/stores/inheritance'
import HeirManager from '../../src/components/HeirManager.vue'
import { Edit2, Trash2 } from 'lucide-vue-next'

describe('HeirManager.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the heirs list from store', () => {
    const wrapper = mount(HeirManager)

    // Check default heirs are rendered
    expect(wrapper.text()).toContain('長子 小明')
    expect(wrapper.text()).toContain('目標持份：1/3 (33.33%)')
    expect(wrapper.text()).toContain('次子 小華')
    expect(wrapper.text()).toContain('長女 小美')
  })

  it('updates parsed target share ratio preview in real-time', async () => {
    const wrapper = mount(HeirManager)

    // Open Add Heir Form
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('新增繼承人'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

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

  it('adds a heir correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(HeirManager)

    // Add heir
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('新增繼承人'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('四子 小強')
    await inputs[1].setValue('1/4')

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    expect(saveBtn!.element.hasAttribute('disabled')).toBe(false)
    await saveBtn!.trigger('click')

    // Verify in store
    const addedHeir = store.heirList.find(h => h.name === '四子 小強')
    expect(addedHeir).toBeDefined()
    expect(addedHeir!.targetShareStr).toBe('1/4')

    // Verify in UI
    expect(wrapper.text()).toContain('四子 小強')
    expect(wrapper.text()).toContain('目標持份：1/4 (25.00%)')
  })

  it('edits a heir correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(HeirManager)

    // Find the row for '長子 小明'
    const rows = wrapper.findAll('.divide-y > div')
    const targetRow = rows.find(r => r.text().includes('長子 小明'))
    expect(targetRow).toBeDefined()

    // Click Edit icon inside the row
    const editIcon = targetRow!.findComponent(Edit2)
    expect(editIcon.exists()).toBe(true)
    await editIcon.trigger('click')

    // Inputs should be pre-filled
    const inputs = wrapper.findAll('input')
    expect(inputs[0].element.value).toBe('長子 小明')
    expect(inputs[1].element.value).toBe('1/3')

    // Update values
    await inputs[0].setValue('長子 小明(已修改)')
    await inputs[1].setValue('1/2')

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    // Verify in store
    const updatedHeir = store.heirList.find(h => h.id === 'heir_1')
    expect(updatedHeir).toBeDefined()
    expect(updatedHeir!.name).toBe('長子 小明(已修改)')
    expect(updatedHeir!.targetShareStr).toBe('1/2')

    // Verify in UI
    expect(wrapper.text()).toContain('長子 小明(已修改)')
    expect(wrapper.text()).toContain('目標持份：1/2 (50.00%)')
  })

  it('deletes a heir correctly', async () => {
    const store = useInheritanceStore()
    const wrapper = mount(HeirManager)

    // Find the row for '次子 小華'
    const rows = wrapper.findAll('.divide-y > div')
    const targetRow = rows.find(r => r.text().includes('次子 小華'))
    expect(targetRow).toBeDefined()

    // Click Trash icon inside the row
    const deleteIcon = targetRow!.findComponent(Trash2)
    expect(deleteIcon.exists()).toBe(true)
    await deleteIcon.trigger('click')

    // Verify in store
    const deletedHeir = store.heirList.find(h => h.name === '次子 小華')
    expect(deletedHeir).toBeUndefined()

    // Verify in UI
    expect(wrapper.text()).not.toContain('次子 小華')
  })

  it('disables the save button and rejects save when inputs are invalid', async () => {
    const store = useInheritanceStore()
    const initialHeirCount = store.heirList.length
    const wrapper = mount(HeirManager)

    // Open Add Heir Form
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('新增繼承人'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    const inputs = wrapper.findAll('input')
    const nameInput = inputs[0]
    const ratioInput = inputs[1]

    // Case 1: Empty name input, non-empty ratio
    await nameInput.setValue('')
    await ratioInput.setValue('1/4')
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeDefined()
    expect(saveBtn!.element.hasAttribute('disabled')).toBe(true)

    // Try to trigger click anyway and verify store did not add the heir
    await saveBtn!.trigger('click')
    expect(store.heirList.length).toBe(initialHeirCount)

    // Case 2: Non-empty name, empty ratio
    await nameInput.setValue('五子 小豪')
    await ratioInput.setValue('')
    expect(saveBtn!.element.hasAttribute('disabled')).toBe(true)

    await saveBtn!.trigger('click')
    expect(store.heirList.length).toBe(initialHeirCount)

    // Case 3: Empty name, empty ratio
    await nameInput.setValue('')
    await ratioInput.setValue('')
    expect(saveBtn!.element.hasAttribute('disabled')).toBe(true)

    await saveBtn!.trigger('click')
    expect(store.heirList.length).toBe(initialHeirCount)

    // Case 4: Editing heir and clearing input
    // First, close form by X button
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('取消'))
    expect(cancelBtn).toBeDefined()
    await cancelBtn!.trigger('click')

    // Open Edit Heir Form for '長子 小明'
    const rows = wrapper.findAll('.divide-y > div')
    const mingRow = rows.find(r => r.text().includes('長子 小明'))
    expect(mingRow).toBeDefined()
    const editIcon = mingRow!.findComponent(Edit2)
    await editIcon.trigger('click')

    // Find inputs and save button
    const editInputs = wrapper.findAll('input')
    const editNameInput = editInputs[0]
    const editRatioInput = editInputs[1]
    const editSaveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))

    // Clear name
    await editNameInput.setValue('')
    expect(editSaveBtn!.element.hasAttribute('disabled')).toBe(true)
    await editSaveBtn!.trigger('click')
    // Verify store has NOT changed
    const originalMing = store.heirList.find(h => h.id === 'heir_1')
    expect(originalMing).toBeDefined()
    expect(originalMing!.name).toBe('長子 小明')

    // Clear ratio (restore name first)
    await editNameInput.setValue('長子 小明')
    await editRatioInput.setValue('')
    expect(editSaveBtn!.element.hasAttribute('disabled')).toBe(true)
    await editSaveBtn!.trigger('click')
    // Verify store has NOT changed
    const originalMingAfterRatioClear = store.heirList.find(h => h.id === 'heir_1')
    expect(originalMingAfterRatioClear).toBeDefined()
    expect(originalMingAfterRatioClear!.targetShareStr).toBe('1/3')
  })
})
