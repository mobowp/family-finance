# 阿里云服务器部署指南

## 📋 前置要求

### 服务器环境
- Ubuntu 20.04+ / CentOS 7+
- Node.js 18+
- Git
- PM2 (自动安装)

### GitHub 配置
- GitHub 仓库访问权限
- GitHub Actions 启用

---

## 🚀 快速部署

### 步骤 1: 配置 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets:

1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret" 添加以下变量:

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 地址 | `123.456.789.0` |
| `SERVER_USERNAME` | SSH 用户名 | `root` 或 `ubuntu` |
| `SERVER_PASSWORD` | SSH 密码 | `your_password` |
| `SERVER_PORT` | SSH 端口 | `22` |
| `PROJECT_PATH` | 项目部署路径 | `/var/www/family-finance` |

### 步骤 2: 服务器首次部署

SSH 连接到服务器后执行:

```bash
# 1. 安装 Node.js (如果未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 克隆项目
cd /var/www
git clone https://github.com/mobowp/family-finance.git
cd family-finance

# 3. 配置环境变量
cp .env.example .env
nano .env  # 编辑环境变量

# 重要: 生成 AUTH_SECRET
openssl rand -base64 32

# 4. 执行部署脚本
chmod +x deploy.sh
bash deploy.sh
```

### 步骤 3: 配置环境变量

编辑 `.env` 文件,配置以下关键变量:

```env
# 数据库 (SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth 配置
AUTH_SECRET="<使用 openssl rand -base64 32 生成>"
NEXTAUTH_URL="http://your-domain.com"

# AI 配置 (可选)
AI_PROVIDER="deepseek"
AI_API_KEY="your_api_key"
AI_MODEL="deepseek-chat"
```

---

## 🔄 自动化部署

配置完成后,每次推送代码到 `main` 分支,GitHub Actions 会自动:

1. ✅ 拉取最新代码
2. ✅ 安装依赖
3. ✅ 同步数据库结构
4. ✅ 构建项目
5. ✅ 重启服务

### 查看部署状态

- GitHub 仓库 → Actions 标签页
- 查看最新的 workflow 运行状态

---

## 🛠️ 常用命令

### 服务管理

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs family-finance

# 重启服务
pm2 restart family-finance

# 停止服务
pm2 stop family-finance

# 删除服务
pm2 delete family-finance
```

### 数据库管理

```bash
# 查看数据库状态
npx prisma studio

# 创建新迁移
npx prisma migrate dev --name your_migration_name

# 应用迁移
npx prisma migrate deploy

# 重置数据库 (⚠️ 危险操作)
npx prisma migrate reset
```

### 手动部署

```bash
cd /var/www/family-finance
bash deploy.sh
```

---

## 🔒 安全建议

1. **使用 SSH 密钥认证** (推荐)
   - 生成 SSH 密钥对
   - 将公钥添加到服务器 `~/.ssh/authorized_keys`
   - 在 GitHub Secrets 中使用 `SERVER_SSH_KEY` 替代密码

2. **配置防火墙**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

3. **配置 HTTPS**
   - 配置 Nginx 反向代理
   - 使用 Let's Encrypt 免费 SSL 证书

4. **定期备份数据库**
   ```bash
   # 备份 SQLite 数据库
   cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)
   ```

---

## 🐛 故障排查

### 部署失败

1. 检查 GitHub Actions 日志
2. SSH 连接服务器查看详细错误:
   ```bash
   pm2 logs family-finance --lines 100
   ```

### 服务无法启动

```bash
# 检查端口占用
sudo lsof -i :3000

# 检查环境变量
cat .env

# 手动启动查看错误
npm run build
npm start
```

### 数据库迁移失败

```bash
# 查看迁移状态
npx prisma migrate status

# 重新生成 Prisma Client
npx prisma generate

# 强制应用迁移
npx prisma migrate deploy --force
```

---

## 📞 技术支持

如遇问题,请检查:
1. GitHub Actions 运行日志
2. 服务器 PM2 日志: `pm2 logs family-finance`
3. 系统日志: `journalctl -u family-finance`

---

## 📝 更新日志

- 2024-12-19: 初始部署配置
- 添加 GitHub Actions 自动化部署
- 添加 PM2 进程管理
- 添加数据库自动迁移