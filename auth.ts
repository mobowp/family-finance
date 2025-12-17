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
        try {
          const user = await prisma.user.findUnique({ 
            where: { id: token.sub } 
          });

          if (!user) {
            console.error('User not found in database, forcing logout');
            return null as any;
          }

          session.user.id = token.sub;
          session.user.name = user.name;
          session.user.email = user.email;
          session.user.image = user.image;
          (session.user as any).role = user.role;
          (session.user as any).familyId = user.familyId;
        } catch (error) {
          console.error('Session callback error:', error);
          if (token.sub) {
            session.user.id = token.sub;
          }
        }
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
