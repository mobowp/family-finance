import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-cyan-400/20 blur-[80px] animate-pulse delay-700" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <LoginForm />
        
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          还没有账号？{' '}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-all">
            立即注册
          </a>
        </p>
      </div>
    </main>
  );
}
