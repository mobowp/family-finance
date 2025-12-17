import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      console.log(`[Auth] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}`);
      // Protect all routes except auth routes and public assets
      const isAuthRoute = nextUrl.pathname.startsWith('/login') || 
                         nextUrl.pathname.startsWith('/register') ||
                         nextUrl.pathname.startsWith('/forgot-password') ||
                         nextUrl.pathname.startsWith('/reset-password');
      
      if (isAuthRoute) {
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
