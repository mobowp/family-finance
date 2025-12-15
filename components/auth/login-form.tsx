'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, ArrowRight, Wallet } from 'lucide-react';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 text-base font-medium" 
      aria-disabled={pending} 
      type="submit"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          登录中...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          登录 <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <form action={dispatch}>
      <Card className="w-full max-w-[400px] mx-auto border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              欢迎回来
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              登录您的家庭理财账号
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              邮箱地址
            </Label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                className="pl-10 h-11 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500 transition-all" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                密码
              </Label>
            </div>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="pl-10 h-11 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500 transition-all" 
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 min-h-[20px]" aria-live="polite" aria-atomic="true">
             {errorMessage && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md w-full">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {errorMessage}
                </div>
             )}
          </div>
        </CardContent>
        <CardFooter className="pb-8">
          <LoginButton />
        </CardFooter>
      </Card>
    </form>
  );
}
