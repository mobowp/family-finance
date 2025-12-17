import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token.sub) {
        // 每次获取 session 时验证用户是否存在
        const user = await prisma.user.findUnique({ 
          where: { id: token.sub } 
        });

        if (!user) {
          // 如果用户不存在（已被删除），返回 null 强制登出
          // 注意：NextAuth 类型定义可能要求返回 Session，但返回 null 会触发未登录状态
          return null as any;
        }

        session.user.id = token.sub;
        // 同步最新的用户信息
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
        (session.user as any).role = user.role;
        (session.user as any).familyId = user.familyId;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          
          // Try bcrypt compare first if it looks like a hash
          let passwordsMatch = false;
          if (user.password.startsWith('$2')) {
             passwordsMatch = await bcrypt.compare(password, user.password);
          } else {
             passwordsMatch = password === user.password;
          }

          if (passwordsMatch) return user;
        }
        
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
