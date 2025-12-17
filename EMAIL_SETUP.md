# 邮件服务配置指南

本文档说明如何配置邮件服务以启用密码重置邮件功能。

## 📧 功能说明

- 如果**已配置**邮件服务:系统会自动发送密码重置邮件到用户邮箱
- 如果**未配置**邮件服务:密码重置链接会在服务器控制台输出(开发环境)

## 🔧 配置步骤

### 方式一:使用 Gmail (推荐)

1. **启用两步验证**
   - 访问 [Google 账户安全设置](https://myaccount.google.com/security)
   - 启用"两步验证"

2. **生成应用专用密码**
   - 访问 [应用专用密码](https://myaccount.google.com/apppasswords)
   - 选择"邮件"和"其他(自定义名称)"
   - 输入名称(如"家庭理财系统")
   - 点击"生成"
   - 复制生成的16位密码

3. **配置环境变量**
   
   在 `.env` 文件中添加:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   EMAIL_FROM_NAME=家庭理财系统
   NEXTAUTH_URL=http://localhost:3000
   ```

### 方式二:使用其他邮件服务

#### QQ 邮箱
```env
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-qq-email@qq.com
EMAIL_PASSWORD=your-authorization-code
```

#### 163 邮箱
```env
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@163.com
EMAIL_PASSWORD=your-authorization-code
```

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

## 🧪 测试邮件发送

1. 启动开发服务器:
   ```bash
   npm run dev
   ```

2. 访问找回密码页面:
   ```
   http://localhost:3000/forgot-password
   ```

3. 输入已注册的邮箱地址

4. 检查:
   - **已配置邮件**:检查邮箱收件箱(可能在垃圾邮件中)
   - **未配置邮件**:查看服务器控制台输出的 MagicLink

## 📝 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `EMAIL_HOST` | SMTP 服务器地址 | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP 端口 | `587` (TLS) 或 `465` (SSL) |
| `EMAIL_SECURE` | 是否使用 SSL | `true` 或 `false` |
| `EMAIL_USER` | 发件人邮箱地址 | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | 邮箱密码或应用专用密码 | `your-app-password` |
| `EMAIL_FROM_NAME` | 发件人显示名称 | `家庭理财系统` |
| `NEXTAUTH_URL` | 应用访问地址 | `http://localhost:3000` |

## ⚠️ 注意事项

1. **不要提交 .env 文件到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 使用 `.env.example` 作为配置模板

2. **Gmail 安全提示**
   - 必须使用"应用专用密码",不能使用账户密码
   - 确保启用了两步验证

3. **生产环境**
   - 建议使用专业的邮件服务(如 SendGrid, AWS SES)
   - 配置 SPF、DKIM 记录以提高送达率

4. **邮件可能进入垃圾箱**
   - 首次发送可能被标记为垃圾邮件
   - 建议将发件地址添加到联系人

## 🎨 邮件模板

系统使用精美的 HTML 邮件模板,包含:
- 渐变色标题
- 醒目的重置密码按钮
- 备用文本链接
- 安全提示信息
- 响应式设计

## 🔒 安全特性

- 令牌有效期:1 小时
- 令牌仅可使用一次
- 密码使用 bcrypt 加密
- 防止邮箱枚举攻击

## 📞 故障排查

### 邮件发送失败

1. 检查环境变量配置是否正确
2. 确认邮箱密码/应用专用密码正确
3. 查看服务器控制台错误信息
4. 检查防火墙是否阻止 SMTP 端口

### 收不到邮件

1. 检查垃圾邮件文件夹
2. 确认邮箱地址正确
3. 查看服务器日志确认邮件已发送
4. 尝试使用其他邮箱测试

## 📚 相关文档

- [Nodemailer 官方文档](https://nodemailer.com/)
- [Gmail SMTP 设置](https://support.google.com/mail/answer/7126229)
- [QQ 邮箱 SMTP 设置](https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256)
