import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    // 在本地保留失败用例的 trace，CI 上仅在首次重试时记录
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    // 仅在失败时保留截图
    screenshot: 'only-on-failure',
    // CI 上在首次重试时保存视频，便于问题定位
    video: process.env.CI ? 'on-first-retry' : 'off',
  },
  webServer: [
    {
      command: 'npm run start:dev',
      // 使用实际存在且返回 200 的接口，避免对 /api (404) 的错误健康检查
      url: 'http://localhost:3000/api/projects',
      reuseExistingServer: true,
      cwd: '../backend',
      timeout: 120_000,
      // 确保后端在 CI/本地都有可用的 SQLite 数据库
      env: {
        // 指向后端已有的 SQLite 数据库文件位置
        DATABASE_URL: 'file:./prisma/dev.db',
        NODE_ENV: process.env.NODE_ENV || 'test',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})