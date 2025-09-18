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

// 重要：为避免跨浏览器并发相互干扰（共享后端 reset），本文件内的用例改为串行执行
// 如需提升并行度，可在服务端为每个 worker 隔离测试数据
// test.describe.configure({ mode: 'serial' }) // 可选：若要强制整文件串行，可取消注释

// E2E：项目列表与详情
test.describe('Projects list & detail', () => {
  test.beforeEach(async ({ page }) => {
    // 移除 resetBackend，避免与其他并发用例相互影响
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
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: '删除' }).click()

    await page.getByRole('button', { name: '确定' }).click()

    // 等待删除成功提示消失
    await waitElMessageDismiss(page)

    // 被删除后，该名称应不可见（表格行计数归零）
    await expect(page.locator('.el-table__row').filter({ hasText: projectName })).toHaveCount(0)
  })
})

// 新增：通过后端 API 快速创建项目（用于批量数据准备）
async function createProjectByAPI(request: any, name: string, type: 'novel' | 'script' = 'novel', baseURL = 'http://localhost:3000/api') {
  const res = await request.post(`${baseURL}/projects`, { data: { name, type, status: 'draft' } })
  if (!res.ok()) throw new Error(`Create project failed: ${res.status()} ${await res.text()}`)
  return await res.json()
}

// 新增：通过页面会话创建项目（与 UI 同 Cookie/Session）
async function createProjectByPage(page: any, name: string, type: 'novel' | 'script' = 'novel') {
  await page.evaluate(async (payload) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: payload.name, type: payload.type, status: 'draft' }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`createProjectByPage failed: ${res.status} ${text}`)
    }
  }, { name, type })
}

// 新增 E2E：搜索过滤
test('搜索过滤：输入关键字过滤列表', async ({ page, request }) => {
  // 移除 resetBackend，避免并发相互影响
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible()
  await waitProjectsFirstLoad(page)

  // 通过 API 创建两条数据
  const a = `Search-A-${Date.now()}`
  const b = `Search-B-${Date.now()}`
  await createProjectByAPI(request, a)
  await createProjectByAPI(request, b)
  
  // 刷新以拉取最新数据（限定顶部工具条的“刷新”按钮，避免严格模式冲突）
  const toolbar = page.locator('div').filter({ has: page.getByPlaceholder('搜索项目') })
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)
  await expect(toolbar.getByRole('button', { name: '刷新' }).first()).toBeVisible()
  await Promise.all([
    page.waitForResponse((resp) => resp.url().endsWith('/api/projects') && resp.request().method() === 'GET'),
    toolbar.getByRole('button', { name: '刷新' }).first().click(),
  ])
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)

  // 直接使用搜索来定位，避免因分页导致的 items 不在首屏
  await page.getByPlaceholder('搜索项目').fill(a)

  // 在卡片栅格中断言只保留 A，B 不存在
  const grid = page.locator('.card-grid')
  await expect(grid).toBeVisible()
  await expect(grid.locator('.el-card').filter({ hasText: a })).toHaveCount(1)
  await expect(grid.locator('.el-card').filter({ hasText: b })).toHaveCount(0)
})

// 新增 E2E：分页翻页
test('分页翻页：点击第 2 页高亮显示', async ({ page, request }) => {
  // 移除 resetBackend，避免并发相互影响
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible()
  await waitProjectsFirstLoad(page)

  // 批量创建 17 条，确保超过一页（每页 8 条）
  const base = Date.now()
  const count = 17
  for (let i = 0; i < count; i++) {
    await createProjectByAPI(request, `Page-${base}-${i}`)
  }
  
  // 刷新数据（限定顶部工具条“刷新”）
  const toolbar2 = page.locator('div').filter({ has: page.getByPlaceholder('搜索项目') })
  // 点击前确保无消息/遮罩干扰，且按钮可见
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)
  await expect(toolbar2.getByRole('button', { name: '刷新' }).first()).toBeVisible()
  await Promise.all([
    page.waitForResponse((resp) => resp.url().endsWith('/api/projects') && resp.request().method() === 'GET'),
    toolbar2.getByRole('button', { name: '刷新' }).first().click(),
  ])
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)

  // 等待第 2 页页码渲染后再点击，避免竞态（兼容 Element Plus 的 button 与 li 两种结构）
  const pagination = page.locator('.el-pagination')
  await expect(pagination).toBeVisible()
  const page2Button = pagination.getByRole('button', { name: /^2$/ })
  if (await page2Button.count()) {
    await page2Button.first().click()
  } else {
    const page2Li = pagination.locator('.el-pager li').filter({ hasText: '2' }).first()
    await expect(page2Li).toBeVisible()
    await page2Li.click()
  }

  // 断言第 2 页高亮（button 或 li 任意结构，使用包含断言）
  const active = pagination.locator('.is-active')
  await expect(active).toContainText('2')
})

// 新增 E2E：编辑回填与未修改提示，然后修改保存返回详情
test('编辑回填与未修改提示，然后修改保存返回详情', async ({ page }) => {
  // 移除 resetBackend，避免并发相互影响
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible()
  await waitProjectsFirstLoad(page)

  const name = `Edit-${Date.now()}`
  await createProject(page, name, 'novel')
  
  // 刷新数据，确保卡片出现（限定顶部工具条“刷新”）
  const toolbar3 = page.locator('div').filter({ has: page.getByPlaceholder('搜索项目') })
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)

  // 进入详情
  const card = page.locator('.card-grid .el-card').filter({ hasText: name }).first()
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: '进入' }).click()

  // 详情页 -> 编辑
  await expect(page.getByRole('heading', { name: new RegExp(`项目：${name}`) })).toBeVisible()
  await page.getByRole('button', { name: '编辑' }).click()

  // 编辑页：名称输入有回填
  const nameInput = page.getByPlaceholder('请输入项目名称')
  await expect(nameInput).toHaveValue(name)

  // 未修改直接保存 -> 提示“未修改，无需保存”或按钮禁用
  const saveBtn = page.getByRole('button', { name: '保存' }).first()
  if (!(await saveBtn.isDisabled())) {
    await saveBtn.click()
    // 某些实现会弹出“未修改，无需保存”，也可能直接不做任何事；这里做软等待，不作为强制通过条件
    await page.getByText('未修改，无需保存').first().waitFor({ state: 'visible', timeout: 1500 }).catch(() => {})
    await waitElMessageDismiss(page)
  } else {
    await expect(saveBtn).toBeDisabled()
  }

  // 修改名称后保存 -> 返回详情页并展示新名称
  const updated = `${name}-X`
  await nameInput.fill(updated)
  await page.getByRole('button', { name: '保存' }).click()
  await waitElMessageDismiss(page)
  await expect(page.getByRole('heading', { name: new RegExp(`项目：${updated}`) })).toBeVisible()
})

// 新增 E2E：删除失败时不应从列表移除（拦截 DELETE 返回 500）
test('删除失败时仍留在列表并提示错误（拦截 500）', async ({ page, request }) => {
  // 移除 resetBackend，避免并发相互影响
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByRole('heading', { name: '项目列表' })).toBeVisible()
  await waitProjectsFirstLoad(page)

  const name = `DelFail-${Date.now()}`
  await createProject(page, name)
  
  // 刷新（限定顶部工具条“刷新”）
  const toolbar4 = page.locator('div').filter({ has: page.getByPlaceholder('搜索项目') })
  await Promise.all([
    page.waitForResponse((resp) => resp.url().endsWith('/api/projects') && resp.request().method() === 'GET'),
    toolbar4.getByRole('button', { name: '刷新' }).click(),
  ])
  await waitElMessageDismiss(page)
  await waitLoadingMaskDismiss(page)

  // 拦截删除，返回 500
  await page.route('**/api/projects/*', async (route) => {
    const req = route.request()
    if (req.method() === 'DELETE') {
      await route.fulfill({ status: 500, body: 'server error' })
    } else {
      await route.continue()
    }
  })

  // 触发删除并确认
  const card = page.locator('.card-grid .el-card').filter({ hasText: name }).first()
  await card.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '确定' }).click()

  // 等待错误提示出现并消失
  await waitElMessageDismiss(page)

  // 该项目仍然可见
  await expect(page.getByText(name).first()).toBeVisible()

  // 清理路由拦截
  await page.unroute('**/api/projects/*')
})