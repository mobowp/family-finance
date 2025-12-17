# 线上部署检查清单

## 环境变量配置

确保在线上环境（Vercel/其他平台）配置了以下环境变量：

### 必需的环境变量

```bash
# 数据库连接
DATABASE_URL="your-production-database-url"

# NextAuth 配置
AUTH_SECRET="your-production-auth-secret"  # 使用 openssl rand -base64 32 生成
NEXTAUTH_URL="https://your-domain.com"     # 线上域名

# 邮件服务配置（用于密码重置）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password  # Gmail 应用专用密码
EMAIL_FROM_NAME=家庭理财系统
```

## 数据库迁移

确保在线上数据库执行了所有迁移：

```bash
# 方法1: 使用 Prisma Migrate
npx prisma migrate deploy

# 方法2: 推送 schema（开发环境）
npx prisma db push
```

## 常见问题排查

### 1. "处理请求时发生错误"

**可能原因：**
- 数据库连接失败
- `PasswordResetToken` 表不存在
- 环境变量未配置

**解决方法：**
1. 检查线上日志，查看具体错误信息
2. 确认 `DATABASE_URL` 正确
3. 运行数据库迁移：`npx prisma migrate deploy`
4. 检查 `NEXTAUTH_URL` 是否设置为线上域名

### 2. 邮件发送失败

**可能原因：**
- Gmail 应用专用密码未配置
- 邮件服务器连接被阻止
- 环境变量缺失

**解决方法：**
1. 使用 Gmail 应用专用密码（不是账号密码）
   - 访问：https://myaccount.google.com/apppasswords
   - 生成新的应用专用密码
2. 检查 `EMAIL_USER` 和 `EMAIL_PASSWORD` 环境变量
3. 查看服务器日志中的重置链接（即使邮件失败，链接也会打印在日志中）

### 3. 数据库表不存在

**错误信息：** `Table 'PasswordResetToken' does not exist`

**解决方法：**
```bash
# 在线上环境执行
npx prisma migrate deploy

# 或者重新生成并推送
npx prisma generate
npx prisma db push
```

### 4. NEXTAUTH_URL 配置错误

**症状：** 重定向失败，回调 URL 错误

**解决方法：**
确保 `NEXTAUTH_URL` 设置为完整的线上域名：
```bash
NEXTAUTH_URL=https://your-domain.com  # 不要有尾部斜杠
```

## Vercel 部署特别注意

### 环境变量设置
1. 进入 Vercel 项目设置
2. 找到 "Environment Variables"
3. 添加所有必需的环境变量
4. 确保选择正确的环境（Production/Preview/Development）

### 数据库迁移
Vercel 不会自动运行迁移，需要：

**方法1：使用 Vercel CLI**
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

**方法2：在 package.json 添加构建脚本**
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 查看日志
```bash
# 使用 Vercel CLI
vercel logs

# 或在 Vercel Dashboard 查看
# https://vercel.com/your-team/your-project/logs
```

## 测试清单

部署后测试以下功能：

- [ ] 用户注册
- [ ] 用户登录
- [ ] 忘记密码（发送邮件）
- [ ] 重置密码
- [ ] 创建家庭
- [ ] 添加交易记录
- [ ] 查看统计数据

## 紧急回退

如果线上出现严重问题：

```bash
# Vercel 回退到上一个部署
vercel rollback

# 或在 Vercel Dashboard 中选择之前的部署并 "Promote to Production"
```

## 监控和日志

建议设置：
1. 错误监控（如 Sentry）
2. 日志聚合（Vercel 自带）
3. 性能监控（Vercel Analytics）

## 获取帮助

如果问题仍未解决：
1. 查看完整的错误日志
2. 检查数据库连接状态
3. 验证所有环境变量
4. 确认数据库迁移已执行
