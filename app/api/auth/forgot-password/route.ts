import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      return NextResponse.json(
        { error: '数据库连接失败，请稍后重试' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: '如果该邮箱存在,我们已发送重置密码链接' },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    try {
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });
    } catch (dbError) {
      console.error('创建重置令牌失败:', dbError);
      return NextResponse.json(
        { error: '无法创建重置令牌，请稍后重试' },
        { status: 500 }
      );
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const result = await sendPasswordResetEmail(email, resetUrl);
        
        if (!result.success) {
          console.error('邮件发送失败,回退到控制台输出');
          console.log('='.repeat(80));
          console.log('密码重置链接 (MagicLink):');
          console.log(resetUrl);
          console.log('='.repeat(80));
        }
      } catch (emailError) {
        console.error('邮件发送异常:', emailError);
        console.log('='.repeat(80));
        console.log('密码重置链接 (MagicLink):');
        console.log(resetUrl);
        console.log('='.repeat(80));
      }
    } else {
      console.log('='.repeat(80));
      console.log('邮件服务未配置,密码重置链接 (MagicLink):');
      console.log(resetUrl);
      console.log('='.repeat(80));
    }

    return NextResponse.json(
      { 
        message: '如果该邮箱存在,我们已发送重置密码链接'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: `处理请求时发生错误: ${error?.message || '未知错误'}` },
      { status: 500 }
    );
  }
}
