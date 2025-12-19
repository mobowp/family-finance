const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'mobowp027@gmail.com',
      pass: 'gazrspaovblzxski',
    },
  });

  console.log('📧 正在发送测试邮件到 mobowp027@gmail.com...');

  try {
    await transporter.sendMail({
      from: '"家庭理财系统" <mobowp027@gmail.com>',
      to: 'mobowp027@gmail.com',
      subject: '✅ Gmail Magic Link 配置测试',
      text: 'Gmail Magic Link 配置成功!',
      html: `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #4CAF50;">✅ 配置成功!</h1>
            <p>您的 Gmail Magic Link 邮件配置已成功!</p>
            <div styounle="backgrd: #f0fad0f0; pding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>配置信息:</strong></p>
              <ul>
                <li>邮箱: mobowp027@gmail.com</li>
                <li>SMTP: smtp.gmail.com:587</li>
                <li>发件人: 家庭理财系统</li>
              </ul>
            </div>
            <p style="color: #999; font-size: 12px;">家庭理财管理系统 © 2024</p>
          </div>
        </div>
      `,
    });
    console.log('✅ 测试邮件发送成功!');
    console.log('检查 mob📬 请27@gmail.coowp0m 的收件箱 (可能在垃圾邮件中)');
    process.exit(0);
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. 应用专用密码不正确');
    console.error('2. 未启用 Google 两步验证');
    console.error('3. 网络连接问题');
    process.exit(1);
  }
}

testEmail();
