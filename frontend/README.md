# 前端项目

这是一个 Web 应用的前端部分，使用 Vue.js 3 和 TypeScript 构建。

## 技术栈
- **框架**: Vue.js 3 (Composition API, Script Setup)
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI 组件库**: Element Plus

## 项目设置

进入 `frontend` 目录并安装依赖：

```bash
cd creation-master-web/frontend
npm install
```

### 开发模式

```bash
npm run dev
```

这将启动 Vite 开发服务器，您可以在浏览器中访问前端应用。前端应用将通过 HTTP 请求与后端服务进行通信。

## 目录结构

```
frontend/
├── public/
├── src/
│   ├── assets/       # 静态资源 (图片、字体等)
│   ├── components/   # 可复用组件
│   ├── router/       # Vue Router 配置
│   ├── stores/       # Pinia 状态管理模块
│   ├── views/        # 页面组件
│   ├── App.vue       # 根组件
│   ├── main.ts       # 入口文件
│   └── vite-env.d.ts # Vite 环境变量声明
├── index.html        # HTML 模板
├── package.json      # 项目依赖和脚本
├── tsconfig.json     # TypeScript 配置
├── vite.config.ts    # Vite 配置
└── ...
```

## 核心功能开发

当前阶段，前端的主要任务是：
1.  **重构 API 调用**: 将所有原先对 Electron IPC API 的调用替换为对后端 RESTful API 的 HTTP 请求。
2.  **UI 适配**: 移除 Electron 特有的 UI 和功能（如文件系统操作），替换为 Web 友好的替代方案。
3.  **页面集成**: 将预兆管理等功能页面与新的后端 API 对接，实现数据展示和交互。
