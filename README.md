# 家庭理财管理系统 (Family Finance System)

### 数据都为测试数据，部署后请删除所有测试数据。
### 数据都为测试数据，部署后请删除所有测试数据。
### 数据都为测试数据，部署后请删除所有测试数据。

## 项目简介
这是一个基于 **Next.js 14** + **Prisma** + **PostgreSQL** 的家庭理财管理系统，旨在提供智能记账、资产管理和数据统计功能。

## 部署状态
[![Deploy to Server](https://github.com/mobowp/family-finance-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/mobowp/family-finance-app/actions/workflows/deploy.yml)

## 环境要求

1. **安装 Node.js** (v18.17 或更高版本)
   - 访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。
   - 安装完成后，在终端运行 `node -v` 确认安装成功。

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置数据库**
   - 默认配置为 SQLite（本地文件数据库），无需额外安装。
   - 初始化数据库：
     ```bash
     npx prisma migrate dev --name init
     ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 `http://localhost:3000` 查看应用。

## 目录结构
- `app/`: 前端页面 (App Router)
- `prisma/`: 数据库模型定义 (schema.prisma)
- `components/`: UI 组件
- `lib/`: 工具函数
