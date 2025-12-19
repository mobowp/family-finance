#!/bin/bash

# 家庭财务管理系统 - 服务器部署脚本
# 使用方法: bash deploy.sh

set -e

echo "======================================"
echo "  家庭财务管理系统 - 服务器部署"
echo "======================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否为首次部署
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}检测到首次部署，开始初始化环境...${NC}"
    
    # 复制环境变量模板
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已创建 .env 文件${NC}"
        echo -e "${YELLOW}⚠ 请编辑 .env 文件，配置数据库和其他环境变量${NC}"
        echo -e "${YELLOW}⚠ 特别注意配置 AUTH_SECRET (使用 openssl rand -base64 32 生成)${NC}"
    else
        echo -e "${RED}✗ 未找到 .env.example 文件${NC}"
        exit 1
    fi
fi

# 1. 拉取最新代码
echo -e "\n${YELLOW}[1/6] 拉取最新代码...${NC}"
git pull origin main
echo -e "${GREEN}✓ 代码更新完成${NC}"

# 2. 安装依赖
echo -e "\n${YELLOW}[2/6] 安装项目依赖...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 3. 生成 Prisma Client
echo -e "\n${YELLOW}[3/6] 生成 Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client 生成完成${NC}"

# 4. 同步数据库
echo -e "\n${YELLOW}[4/6] 同步数据库结构...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ 数据库同步完成${NC}"

# 5. 构建项目
echo -e "\n${YELLOW}[5/6] 构建生产版本...${NC}"
npm run build
echo -e "${GREEN}✓ 项目构建完成${NC}"

# 6. 重启服务
echo -e "\n${YELLOW}[6/6] 重启应用服务...${NC}"

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
fi

# 重启或启动服务
if pm2 describe family-finance > /dev/null 2>&1; then
    pm2 restart family-finance
    echo -e "${GREEN}✓ 服务重启完成${NC}"
else
    pm2 start npm --name "family-finance" -- start
    pm2 save
    pm2 startup
    echo -e "${GREEN}✓ 服务启动完成${NC}"
fi

# 显示服务状态
echo -e "\n${GREEN}======================================"
echo -e "  部署完成！"
echo -e "======================================${NC}"
pm2 status

echo -e "\n${YELLOW}常用命令:${NC}"
echo -e "  查看日志: ${GREEN}pm2 logs family-finance${NC}"
echo -e "  重启服务: ${GREEN}pm2 restart family-finance${NC}"
echo -e "  停止服务: ${GREEN}pm2 stop family-finance${NC}"
echo -e "  查看状态: ${GREEN}pm2 status${NC}"
