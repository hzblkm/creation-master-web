# 后端项目

这是一个 Web 应用的后端部分，使用 NestJS 和 TypeScript 构建，提供 RESTful API 服务。

## 技术栈
- **运行时**: Node.js
- **框架**: NestJS
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma (推荐)

## 项目设置

进入 `backend` 目录并安装依赖：

```bash
cd creation-master-web/backend
npm install
```

### 数据库设置 (PostgreSQL)

确保您的本地环境中安装并运行了 PostgreSQL 数据库。您可以使用 Docker 启动一个 PostgreSQL 容器：

```bash
docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

创建新的数据库供本项目使用，例如 `creation_master_db`。

配置 `backend/.env` 文件，更新数据库连接字符串：

```
DATABASE_URL="postgresql://user:password@localhost:5432/creation_master_db?schema=public"
```

### 数据库迁移 (Prisma)

在 `backend/` 目录下，运行 Prisma 迁移命令来创建数据库表结构和生成 Prisma Client：

```bash
npx prisma migrate dev --name init
```

### 开发模式

```bash
npm run start:dev
```

这将启动 NestJS 后端服务，默认运行在 `http://localhost:3000` (如果未配置端口) 或 `http://localhost:3001` (NestJS 默认)。前端应用将通过 HTTP 请求与此服务进行通信。

## 目录结构

```
backend/
├── src/
│   ├── auth/         # 认证模块 (待实现)
│   ├── common/       # 通用工具、拦截器、守卫等
│   ├── database/     # 数据库连接和配置 (如 Prisma Client)
│   ├── modules/      # 各功能模块 (projects, chapters, settings, foreshadowings, ai, export)
│   │   ├── projects/
│   │   ├── chapters/
│   │   ├── settings/
│   │   ├── foreshadowings/
│   │   ├── ai/
│   │   └── export/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts         # 入口文件
├── prisma/         # Prisma Schema 和迁移文件
├── test/           # 测试文件
├── package.json    # 项目依赖和脚本
├── nest-cli.json   # NestJS CLI 配置
├── tsconfig.json   # TypeScript 配置
├── .env.example    # 环境变量示例
└── ...
```

## 核心 API 开发

当前阶段，后端的主要任务是：
1.  **数据库交互**: 实现与 PostgreSQL 数据库的 CRUD 操作。
2.  **API 接口定义**: 为所有前端需要的功能提供 RESTful API 接口。
3.  **AI 服务代理**: 转发前端的 AI 请求到 OpenAI API，并在后端处理 API Key。
4.  **文件生成**: 实现文件（TXT, MD, PDF）的生成逻辑，并通过 API 提供下载。
