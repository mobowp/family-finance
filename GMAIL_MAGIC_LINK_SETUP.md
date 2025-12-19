# Gmail Magic Link 配置指南

## 📧 什么是 Magic Link?

Magic Link 是一种无密码登录方式,用户输入邮箱后,系统会发送一个包含登录链接的邮件,点击链接即可登录,无需记住密码。

---

## 🔧 配置步骤

### 步骤 1: 获取 Gmail 应用专用密码

由于 Gmail 使用 Gmail 启用了两步验证,不能直接密码,需要生成"应用专用密码"。

1. **登录 Google 账号**
   - 访问: https://myaccount.google.com/

2. **启用两步验证** (如果还没启用)
   - 进入"安全性" → "两步验证"
   - 按照提示完成设置

3. **生成应用专用密码**
   - 访问: https://myaccount.google.com/apppasswords
   - 或者: Google 账号 → 安全性 → 两步验证 → 应用专用密码
   - 选择应用: "邮件"
   - 选择设备: "其他(自定义名称)"
   - 输入名称: "家庭理财系统"
   - 点击"生成"
   - **复制生成的 16 位密码** (格式: xxxx xxxx xxxx xxxx)

### 步骤 2: 配置环境变量

编辑 `.env` 文件,添加以下配置:

```env
# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com          # 替换为您的 Gmail 地址
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx       # 替换为步骤1生成的应用专用密码
EMAIL_FROM_NAME=家庭理财系统

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000       # 本地开发
# NEXTAUTH_URL=http://your-domain.com    # 生产环境
AUTH_SECRET=your-auth-secret-here        # 使用 openssl rand -base64 32 生成
AUTH_TRUST_HOST=true
```

### 步骤 3: 重启应用

```bash
# 本地开发
npm run dev

# 生产环境
pm2 restart family-finance
```

---

## 🧪 测试 Magic Link

### 本地测试

1. 访问登录页面: http://localhost:3000/login
2. 输入您的邮箱地址
3. 点击"发送登录链接"按钮
4. 检查您的 Gmail 收件箱
5. 点击邮件中的"登录"按钮
6. 自动跳转并登录成功!

### 生产环境测试

1. 访问: http://your-domain.com/login
2. 按照相同步骤测试

---

## 🚀 部署到服务器

### 更新服务器环境变量

SSH 连接到服务器:

```bash
ssh root@114.55.131.189
cd /var/www/family-finance
nano .env
```

添加邮件配置:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=家庭理财系统
NEXTAUTH_URL=http://114.55.131.189:3000
AUTH_TRUST_HOST=true
```

保存并重启服务:

```bash
pm2 restart family-finance
pm2 logs family-finance
```

---

## 🎨 自定义邮件模板

Magic Link 邮件模板位于 NextAuth 内部,如果需要自定义,可以创建自定义邮件发送函数。

### 创建自定义邮件模板

编辑 `lib/email.ts`,添加 Magic Link 邮件模板:

```typescript
export async function sendMagicLinkEmail(email: string, url: string) {
  conions =st mailOpt {
    from: `"${process.env.EMAIL_FROM_NAME || '家庭理财系统'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '登录链接 - 家庭理财管理系统',
    html: getMagicLinkEmailTemplate(url),
  };

  trait try {
    awansporter.sendMail(mailOptions);
    console.log(`Magic Link 邮件已发送到: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { succesfalse, s: error };
  }
}

function getMagicLinkEmailTemplate(url: string): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta char8">
  set="UTF-    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>登录链接</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 登录链接</h1>
                </td>
              </tr>
              
              <tr>
                <td e=styl"padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    您好,
         </p>         
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    点击下面的按钮即可登录家庭理财管理系统:
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${url}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          立即登录
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px  color: #0;6b7280; font-size: 14px; line-height: 1.6;">
                    如果按钮无法点击,请复制以下链接到浏览器地址栏:
                  </p>
                  <p style="margin: 0 0 20px; padding: 12px; background-color: #f9fafb; border-left: 3px solid #667eea; color: #374151; font-size: 14px; word-break: break-all; border-radius: 4px;">
                    ${url}
                  </p>
                  
                  <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
                    <p style=" 0;margin: color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⚠️ <strong>安全提示:</strong>
                    </p>
                    <ul style="margin: 8px 0 0; padding-left: 20px; color: #92; line-he400e; fon6;">
t-size: 14pxight: 1.                      <li>此链接将在 <strong>24 小时</strong>后失效</li>
                      <li>此链接只能使用 <strong>一次</strong></li>
                      <li>如果您没有请求登录,请忽略此邮件</li>
                    </ul>
                  </div>
    </td>
                          </tr>
              
              <tr>
                <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                    此邮件由系统自动发送,请勿直接回复
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} 家庭理财管理系统. All right
           p>
            </td>        s reserved.   </
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
```

---

## 🐛 故障排查

### 1. 邮件发送失败

**错误**: `Invalid login: 535-5.7.8 Username and Password not accepted`

**解决方案**:
- 确认已启用 Google 两步验证
- 使用应用专用密码,不是 Gmail 登录密码
- 检查 `EMAIL_USER` 和 `EMAIL_PASSWORD` 是否正确

### 2. 邮件进入垃圾箱

**解决方案**:
- 将发件人添加到联系人
- 标记为"非垃圾邮件"
- 考虑使用自定义域名邮箱

### 3. 链接点击后无反应

**解决方案**:
- 检查 `NEXTAUTH_URL` 是否正确
- 确认 `AUTH_SECRET` 已配置
- 查看浏览器控制台错误
- 检查服务器日志: `pm2 logs family-finance`

### 4. 本地开发收不到邮件

**解决方案**:
- 检查网络连接
- 确认 Gmail SMTP 端口 587 未被防火墙阻止
- 尝试使用 `EMAIL_PORT=465` 和 `EMAIL_SECURE=true`

---

## 📝 环境变量完整示例

### 本地开发 (.env)

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="7OtzouKFh0BMNHLzJIxEqmFTo2fqnGulSulMlK2K+pU="
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000

# Gmail 配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME=家庭理财系统

# AI 配置 (可选)
AI_PROVIDER=deepseek
AI_API_KEY=your_api_key
AI_MODEL=deepseek-chat
```

### 生产环境 (服务器 .env)

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="7OtzouKFh0BMNHLzJIxEqmFTo2fqnGulSulMlK2K+pU="
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://114.55.131.189:3000

# Gmail 配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME=家庭理财系统

# AI 配置
AI_PROVIDER=deepseek
AI_API_KEY=your_api_key
AI_MODEL=deepseek-chat
```

---

## ✅ 验证配置

运行以下命令测试邮件配置:

```bash
# 创建测试脚本
cat > test-email.js << 'EOF'
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: '测试邮件 - 家庭理财系统',
  text: 'Gmail Magic Link 配置成功!',
 tml: '< hh1>✅ Gmail Magic Link 配置成功!</h1>',
}).then(() => {
  console.log('✅ 邮件发送成功!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 邮件发送失败:', error);
  process.exit(1);
});
EOF

# 运行测试
node test-email.js
```

---

## 🎉 完成!

配置完成后,用户可以:
1. 在登录页面输入邮箱
2. 收到包含登录链接的邮件
3. 点击链接即可登录,无需密码!

---

## 📞 需要帮助?

如遇问题,请检查:
1. Gmail 应用专用密码是否正确
2. 环境变量是否正确配置
3. 服务器日志: `pm2 logs family-finance`
4. 邮件服务器连接: `telnet smtp.gmail.com 587`
