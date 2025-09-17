import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Projects from '../views/Projects.vue'
import type { ComponentPublicInstance } from 'vue'

// Mock element-plus message APIs
vi.mock('element-plus', () => {
  return {
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn(() => Promise.resolve()),
    },
  }
})

// Mock axios
const { patchMock, deleteMock, getMock, postMock } = vi.hoisted(() => ({
  patchMock: vi.fn(),
  deleteMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
}))
vi.mock('axios', () => {
  return {
    default: {
      get: getMock,
      post: postMock,
      patch: patchMock,
      delete: deleteMock,
    },
  }
})

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve))

// Common stubs for Element Plus components used in template
const elStubs = [
  'el-table',
  'el-table-column',
  'el-input',
  'el-select',
  'el-option',
  'el-button',
  'el-dialog',
  'el-form',
  'el-form-item',
]

type Vm = ComponentPublicInstance & Record<string, any>

describe('Projects.vue minimal tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('formatTime returns a readable string', async () => {
    const wrapper = mount(Projects, { global: { stubs: elStubs } })
    const vm = wrapper.vm as Vm
    const iso = '2024-01-01T00:00:00.000Z'
    const formatted = vm.formatTime(iso)
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
  })

  it('submitEdit optimistic update succeeds and dialog closes', async () => {
    const wrapper = mount(Projects, { global: { stubs: elStubs } })
    await flushPromises()
    const vm = wrapper.vm as Vm

    // seed projects
    vm.projects = [
      { id: '1', name: 'P1', type: 'novel', status: 'draft', createdAt: new Date().toISOString() },
    ]
    vm.editForm = { id: '1', name: 'P1-Edited', type: 'script', status: 'active' }
    vm.editDialogVisible = true

    patchMock.mockResolvedValue({ data: { id: '1' } })

    await vm.submitEdit()
    await flushPromises()

    expect(patchMock).toHaveBeenCalledWith('/api/projects/1', {
      name: 'P1-Edited',
      type: 'script',
      status: 'active',
    })
    expect(vm.projects[0].name).toBe('P1-Edited')
    expect(vm.projects[0].type).toBe('script')
    expect(vm.projects[0].status).toBe('active')
    expect(vm.editDialogVisible).toBe(false)
  })

  it('submitEdit rollback on failure', async () => {
    const wrapper = mount(Projects, { global: { stubs: elStubs } })
    await flushPromises()
    const vm = wrapper.vm as Vm

    vm.projects = [
      { id: '1', name: 'P1', type: 'novel', status: 'draft', createdAt: new Date().toISOString() },
    ]
    vm.editForm = { id: '1', name: 'P1-Edited', type: 'script', status: 'active' }
    vm.editDialogVisible = true

    patchMock.mockRejectedValue(new Error('network error'))

    await vm.submitEdit()
    await flushPromises()

    // rollback to previous
    expect(vm.projects[0].name).toBe('P1')
    expect(vm.editDialogVisible).toBe(true)
  })

  it('removeProject optimistic delete succeeds', async () => {
    const { ElMessageBox } = await import('element-plus')
    ;(ElMessageBox.confirm as any).mockResolvedValueOnce()

    const wrapper = mount(Projects, { global: { stubs: elStubs } })
    await flushPromises()
    const vm = wrapper.vm as Vm

    vm.projects = [
      { id: '1', name: 'P1', type: 'novel', status: 'draft', createdAt: new Date().toISOString() },
      { id: '2', name: 'P2', type: 'novel', status: 'draft', createdAt: new Date().toISOString() },
    ]

    deleteMock.mockResolvedValue({})

    await vm.removeProject(vm.projects[0])
    await flushPromises()

    expect(deleteMock).toHaveBeenCalledWith('/api/projects/1')
    expect(vm.projects.length).toBe(1)
    expect(vm.projects[0].id).toBe('2')
  })

  it('removeProject rollback on failure', async () => {
    const { ElMessageBox } = await import('element-plus')
    ;(ElMessageBox.confirm as any).mockResolvedValueOnce()

    const wrapper = mount(Projects, { global: { stubs: elStubs } })
    await flushPromises()
    const vm = wrapper.vm as Vm

    vm.projects = [
      { id: '1', name: 'P1', type: 'novel', status: 'draft', createdAt: new Date().toISOString() },
      { id: '2', name: 'P2', type: 'novel', status: 'draft', createdAt: new Date().toISOString() },
    ]

    deleteMock.mockRejectedValue(new Error('network error'))

    await vm.removeProject(vm.projects[0])
    await flushPromises()

    // rollback: list should be restored to 2 items
    expect(vm.projects.length).toBe(2)
    expect(vm.projects[0].id).toBe('1')
  })
})