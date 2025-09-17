# 通用创作管理体系数字化平台 (Web 版本)

这是一个将现有 Electron 桌面应用重构为 Web 应用程序的项目。本项目的目标是创建一个MVP (最小可行产品)，专注于在开发环境下实现核心功能。

## 架构概览
本项目采用前后端分离的架构：
- **前端 (Frontend)**: 基于 Vue.js 3 和 TypeScript 构建，提供用户界面。
- **后端 (Backend)**: 基于 NestJS 和 TypeScript 构建，提供 RESTful API 服务，处理业务逻辑和数据持久化。

## 技术栈

### 前端
- **框架**: Vue.js 3 (Composition API, Script Setup)
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI 组件库**: Element Plus

### 后端
- **运行时**: Node.js
- **框架**: NestJS
- **语言**: TypeScript
- **数据库**: PostgreSQL (本地开发环境)
- **ORM**: Prisma (推荐，或 TypeORM)

## 与旧 Electron 桌面应用的区别
- **架构**: 从桌面应用的主进程/渲染进程架构，转变为独立的前端应用 + 后端 API 服务。
- **数据持久化**: 从本地 SQLite 数据库，转变为基于 PostgreSQL 的集中式数据库。
- **AI 服务**: AI 服务的调用将通过后端代理进行，确保 API Key 的安全性。
- **文件操作**: 移除 Electron 对本地文件系统的直接访问，改为通过后端 API 提供文件上传/下载功能。

## 本地开发环境设置

### 1. 克隆仓库
```bash
git clone <您的仓库地址>
cd <您的仓库地址>
```

### 2. 后端设置
进入后端目录并安装依赖：
```bash
cd creation-master-web/backend
npm install
```

**数据库设置 (PostgreSQL)**:
- 确保您的本地环境中安装并运行了 PostgreSQL 数据库。
- 创建一个新的数据库供本项目使用。
- 配置 `backend/.env` 文件，更新数据库连接字符串。

**数据库迁移 (Prisma)**:
- 在 `backend/` 目录下，运行 Prisma 迁移命令来创建数据库表结构。
```bash
npx prisma migrate dev
```

**启动后端服务**:
```bash
npm run start:dev
```

### 3. 前端设置
进入前端目录并安装依赖：
```bash
cd ../frontend
npm install
```

**启动前端服务**:
```bash
npm run dev
```

## 开发指南
- **功能模块划分**: 前后端分别根据功能模块进行开发，保持接口清晰。
- **API 定义**: 优先定义 RESTful API 接口和数据传输对象 (DTOs)。
- **错误处理**: 前后端都需要健壮的错误处理机制。
- **数据迁移**: 在开发初期，可以手动填充测试数据。未来如果需要，可以编写脚本将旧 Electron 应用的 SQLite 数据导入到 PostgreSQL。

---

## 进一步开发计划
在 MVP 完成后，可以考虑以下增强：
- 用户认证与授权模块的完善。
- 部署到生产环境。
- 性能优化和安全性增强。
- 实时协作功能。
- 更丰富的数据可视化和统计。
