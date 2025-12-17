import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || '家庭理财系统'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '重置密码 - 家庭理财管理系统',
    html: getPasswordResetEmailTemplate(resetUrl),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`密码重置邮件已发送到: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { success: false, error };
  }
}

function getPasswordResetEmailTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>重置密码</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 重置密码</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    您好,
                  </p>
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    我们收到了您重置密码的请求。请点击下面的按钮来重置您的密码:
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          重置密码
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    如果按钮无法点击,请复制以下链接到浏览器地址栏:
                  </p>
                  <p style="margin: 0 0 20px; padding: 12px; background-color: #f9fafb; border-left: 3px solid #667eea; color: #374151; font-size: 14px; word-break: break-all; border-radius: 4px;">
                    ${resetUrl}
                  </p>
                  
                  <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⚠️ <strong>重要提示:</strong>
                    </p>
                    <ul style="margin: 8px 0 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <li>此链接将在 <strong>1 小时</strong>后失效</li>
                      <li>此链接只能使用 <strong>一次</strong></li>
                      <li>如果您没有请求重置密码,请忽略此邮件</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                    此邮件由系统自动发送,请勿直接回复
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} 家庭理财管理系统. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
