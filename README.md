# ai-ticket-web

<div align="center">

AI 智能工单分析平台前端项目

基于 Vue 3 + Vite + TypeScript + Ant Design Vue 构建的企业级中后台前端系统

</div>

---

## ✨ 项目简介

`ai-ticket-web` 是一套面向企业场景的 **AI 智能工单分析平台前端项目**，用于承载工单管理、AI 智能分析、知识库管理、数据驾驶舱、系统管理等核心能力。

项目以“**先搭稳定骨架，再逐步扩展业务能力**”为建设原则，强调：

- 清晰的工程结构
- 可维护的代码组织
- 可扩展的布局与路由设计
- 面向后续 AI 能力接入的前端架构预留

---

## 🚀 核心特性

- 基于 **Vue 3 + Vite + TypeScript** 的现代前端工程
- 使用 **Ant Design Vue** 构建企业级中后台界面
- 支持 **登录、路由鉴权、异常页面** 等基础后台能力
- 支持 **可扩展 Layout 架构**，预留左侧菜单 / 顶部菜单 / 混合布局切换能力
- 工单中心采用 **单列表承载多状态查询** 的轻量化设计
- 预留 **AI 分析、知识库、控制台、动态菜单权限** 等后续扩展能力
- 遵循 **Vue Official 推荐风格**，优先保证可读性与可维护性

---

## 🧱 技术栈

### 前端框架
- Vue 3
- Vite
- TypeScript

### UI / 交互
- Ant Design Vue
- ECharts

### 路由 / 状态
- Vue Router
- Pinia

### 网络请求
- Axios

### 样式
- SCSS

### 工程化
- ESLint
- Prettier

---

## 📦 当前模块

### 工作台
- 工作台首页
- 我的待办

### 工单中心
- 工单列表
- 新建工单
- 工单回收站

### AI 智能分析
- AI 分析总览
- 智能分析结果

### 知识库中心
- 知识文档管理
- FAQ 管理

### 数据分析
- 数据驾驶舱

### 系统管理
- 用户管理
- 角色管理
- 菜单管理

### 控制台模块
- Codex 工作台（预留）

---

## 🗂 菜单结构

```text
工作台
├─ 工作台首页
└─ 我的待办

工单中心
├─ 工单列表
├─ 新建工单
└─ 工单回收站

AI 智能分析
├─ AI 分析总览
└─ 智能分析结果

知识库中心
├─ 知识文档管理
└─ FAQ 管理

数据分析
└─ 数据驾驶舱

系统管理
├─ 用户管理
├─ 角色管理
└─ 菜单管理

控制台
└─ Codex 工作台（预留）

📝 工单中心设计说明

工单中心采用“单列表承载多状态查询”的设计思路。

也就是：

左侧菜单只保留：
工单列表
新建工单
工单回收站
待处理、处理中、已完成、已关闭、超时、异常等不同状态工单
不单独拆成多个菜单，而是统一在 工单列表页内部 通过以下方式切换：
Tabs
查询条件
状态筛选
统计卡片

这样做的好处是：

菜单更简洁
页面复用度更高
路由和缓存更容易管理
更符合企业后台常见设计方式
🧭 路由说明
业务路由
/dashboard/home
/dashboard/todo
/ticket/list
/ticket/create
/ticket/recycle
/ai-analysis/overview
/ai-analysis/result
/knowledge/document
/knowledge/faq
/report/dashboard
/system/user
/system/role
/system/menu
认证与异常页
/login
/404
/500
控制台
/console/workbench
🧩 Layout 设计说明

项目 Layout 采用 可配置设计，不将菜单位置和整体结构硬编码在某一种布局中。

当前阶段可以先实现一个默认布局，但整体架构需支持后续扩展：

左侧菜单布局
顶部菜单布局
混合布局
Header 固定/非固定
标签页开关
面包屑开关
菜单折叠
应用设置项统一管理

建议后续通过独立的 app settings / layout settings 统一管理布局配置。

🔐 登录与鉴权

项目已规划或接入以下基础认证能力：

登录页
Token 存储
登录态持久化
路由白名单
路由守卫
未登录自动跳转登录页
已登录访问登录页自动跳转首页

后续扩展方向：

获取当前用户信息
刷新 Token
动态菜单权限
角色权限控制
按钮级权限控制
动态路由注册
⚠️ 异常页面

项目包含标准异常页面：

404 页面
500 页面

后续可扩展：

403 页面
无权限页面
网络异常页
空状态页
📁 目录结构
src
├─ api
├─ assets
├─ components
├─ config
├─ constants
├─ enums
├─ hooks
├─ layout
├─ router
├─ store
├─ styles
├─ types
├─ utils
├─ views
│  ├─ dashboard
│  ├─ ticket
│  ├─ ai-analysis
│  ├─ knowledge
│  ├─ report
│  ├─ system
│  ├─ login
│  ├─ exception
│  └─ console
├─ App.vue
└─ main.ts
🧪 环境要求

建议本地环境：

Node.js 18+
pnpm 8+
Git
⚙️ 安装与运行
安装依赖
pnpm install
启动开发环境
pnpm dev
打包生产环境
pnpm build
代码检查
pnpm lint
代码格式化
pnpm format
📌 开发原则

项目当前阶段遵循以下原则：

先搭稳定骨架，再补业务细节
先保证结构清晰，再考虑高级抽象
优先可读性与可维护性
公共能力适度沉淀，不提前过度封装
保持企业级后台风格
为后续权限、动态路由、AI 模块、控制台能力预留扩展空间
🔭 后续规划

后续计划逐步补充：

动态菜单与权限控制
工单详情页
AI 推荐面板
知识检索与推荐
数据可视化增强
通用表格 / 表单 / 搜索组件封装
请求拦截器与统一错误处理
多标签页导航
KeepAlive 页面缓存
控制台接入 Codex / CLI
布局模式切换
主题配置与应用设置
📘 项目信息
项目名称：ai-ticket-web
中文名称：AI 智能工单分析平台前端
项目定位：企业级 AI 智能工单分析后台前端系统
📄 说明

当前项目处于持续建设阶段，README 会随着模块完善和架构演进持续更新。
