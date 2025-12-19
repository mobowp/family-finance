import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.csrf-token');
  cookieStore.delete('__Secure-next-auth.csrf-token');
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('__Secure-next-auth.callback-url');
  
  return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
}
