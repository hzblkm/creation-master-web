import { test, expect } from '@playwright/test'

// 等待 Element Plus 顶部消息消失，避免遮挡交互
async function waitElMessageDismiss(page) {
  const message = page.locator('.el-message')
  // 若短时间出现则等待其可见与消失；未出现则忽略
  await message.first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
  await message.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
}

// 等待全局加载遮罩消失（Element Plus Loading：.el-loading-mask）
async function waitLoadingMaskDismiss(page) {
  const mask = page.locator('.el-loading-mask')
  await mask.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
}

async function resetBackend(request: any, baseURL = 'http://localhost:3000/api') {
  const res = await request.post(`${baseURL}/__test__/reset`)
  if (!res.ok()) {
    throw new Error(`Reset backend failed: ${res.status()} ${await res.text()}`)
  }
}

async function waitProjectsFirstLoad(page) {
  // 等待首次 /api/projects 请求返回（避免长期 WS 阻塞 networkidle）
  await Promise.race([
    page.waitForResponse((resp) => resp.url().endsWith('/api/projects') && resp.request().method() === 'GET'),
    page.waitForTimeout(3000), // 最多等 3s，防止异常阻塞
  ])
}

// 等待“新建项目”按钮处于可点击（非 loading 且未禁用）
async function waitNewButtonReady(page) {
  const locator = page.getByRole('button', { name: '新建项目' })
  await expect(locator.first()).toBeVisible()
  // 轮询到按钮未处于 loading/disabled
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const btn = btns.find((b) => (b.textContent || '').includes('新建项目')) as HTMLButtonElement | undefined
    if (!btn) return false
    const disabled = btn.hasAttribute('disabled')
    const isLoading = btn.className.split(' ').includes('is-loading')
    return !disabled && !isLoading
  }, null, { timeout: 5000 })
}

// 简化的辅助函数：创建项目
async function createProject(page, name: string, type: 'novel' | 'script' = 'novel') {
  const input = page.getByPlaceholder('项目名称')
  await expect(input).toBeVisible()
  await input.fill(name)

  // 点击前等待消息/遮罩消失与按钮就绪
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)
  await waitNewButtonReady(page)

  await page.getByRole('button', { name: '新建项目' }).first().click()
  await waitElMessageDismiss(page)
  // 等待成功后，列表里出现该名称（卡片或表格）
  await expect(page.getByText(name).first()).toBeVisible()
}

// E2E：项目列表与详情
test.describe('Projects list & detail', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetBackend(request)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible()
    await waitProjectsFirstLoad(page)
    await waitElMessageDismiss(page)
    await waitLoadingMaskDismiss(page)
  })

  test('空态下可新建项目并进入详情', async ({ page }) => {
    const projectName = `E2E-项目-${Date.now()}`
    await createProject(page, projectName)

    // 切换点击前确保没有遮挡
    await waitElMessageDismiss(page)

    // 卡片视图默认开启，点击“进入”
    await page.getByRole('button', { name: '进入' }).first().click()

    // 详情页标题包含“项目：{name}”
    await expect(page.getByRole('heading', { name: new RegExp(`项目：${projectName}`) })).toBeVisible()

    // 详情中基本字段可见
    await expect(page.getByText('名称').first()).toBeVisible()
    await expect(page.getByText('类型').first()).toBeVisible()
    await expect(page.getByText('状态').first()).toBeVisible()
    await expect(page.getByText('创建时间').first()).toBeVisible()

    // 返回列表
    await page.getByRole('button', { name: '返回列表' }).click()
    await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible()

    // UI 级清理：删除刚创建的项目（卡片视图）
    const card = page.locator('.card-grid .el-card').filter({ hasText: projectName }).first()
    await card.getByRole('button', { name: '删除' }).click()
    await page.getByRole('button', { name: '确定' }).click()
    await waitElMessageDismiss(page)
    await expect(page.getByText(projectName)).toBeHidden()
  })

  test('表格视图与删除项目', async ({ page }) => {
    const projectName = `E2E-表格-${Date.now()}`
    await createProject(page, projectName)

    // 切换到表格视图（等待提示消失以避免拦截）
    await waitElMessageDismiss(page)
    await waitLoadingMaskDismiss(page)
    await page.locator('.el-radio-button__inner:has-text("表格视图")').click()

    // 断言表格容器可见（Element Plus: .el-table）
    const table = page.locator('.el-table')
    await expect(table).toBeVisible()

    // 在表格中删除（点击行操作里的删除，并确认）
    const row = page.locator('.el-table__row').filter({ hasText: projectName }).first()
    await row.getByRole('button', { name: '删除' }).click()

    await page.getByRole('button', { name: '确定' }).click()

    // 等待删除成功提示消失
    await waitElMessageDismiss(page)

    // 被删除后，该名称应不可见
    await expect(page.getByText(projectName)).toBeHidden()
  })
})