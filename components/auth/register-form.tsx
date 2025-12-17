'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { register } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

function RegisterButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5" aria-disabled={pending} type="submit">
      {pending ? '创建账号中...' : '创建账号'}
    </Button>
  );
}

export function RegisterForm() {
  const [errorMessage, dispatch] = useActionState(register, undefined);
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');

  return (
    <form action={dispatch}>
      {inviteCode && <input type="hidden" name="inviteCode" value={inviteCode} />}
      <Card className="w-full max-w-sm mx-auto backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">创建账号</CardTitle>
          <CardDescription className="text-center">
            输入您的信息以创建账号
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" name="name" placeholder="您的姓名" required className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" required minLength={6} className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex items-center space-x-2" aria-live="polite" aria-atomic="true">
             {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <RegisterButton />
          <div className="text-sm text-center text-gray-500">
            已经有账号了？{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              立即登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
