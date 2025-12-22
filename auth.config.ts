import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60,
  },
  useSecureCookies: false,
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // Protect all routes except auth routes and public assets
      const isAuthRoute = nextUrl.pathname.startsWith('/login') || 
                         nextUrl.pathname.startsWith('/register') ||
                         nextUrl.pathname.startsWith('/forgot-password') ||
                         nextUrl.pathname.startsWith('/reset-password');
      
      if (isAuthRoute) {
        if (isLoggedIn) {
          // 如果已经在首页，不要重定向，避免循环
          if (nextUrl.pathname === '/') {
            return true;
          }
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }
      
      return isLoggedIn;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
