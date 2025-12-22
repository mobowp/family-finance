'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CreditCard, 
  Wallet, 
  PieChart, 
  ArrowRightLeft,
  Menu,
  Settings
} from "lucide-react";
import { Button } from "./ui/button";
import { NavbarUser } from "./navbar-user";

export function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";

  const routes = [
    {
      href: "/",
      label: "首页",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/transactions",
      label: "记账",
      icon: ArrowRightLeft,
      active: pathname.startsWith("/transactions"),
    },
    {
      href: "/wealth",
      label: "财富",
      icon: Wallet,
      active: pathname.startsWith("/wealth") || pathname.startsWith("/accounts") || pathname.startsWith("/assets"),
    },
    {
      href: "/settings",
      label: "设置",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  // 如果是登录或注册页面，不显示 Navbar (可选，但为了美观，通常隐藏)
  // 但既然用户说"这个顶部切换不好看"，说明他看到了，所以我还是保留它，只是美化它。
  // 或者，我可以做一个判断，如果是 auth 页面，显示简化版。
  // 不过为了保持一致性，我先美化通用版。

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80 supports-[backdrop-filter]:bg-white/60 safe-area-top">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto justify-between">
        <div className="flex items-center gap-2 sm:gap-8">
          <Link href="/" className="hidden sm:flex items-center space-x-3 group">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105 duration-300">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              家庭理财
            </span>
          </Link>
          
          {!isAuthPage && (
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto no-scrollbar max-w-[calc(100vw-80px)] sm:max-w-none">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  prefetch={true}
                  className={cn(
                    "relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium rounded-full transition-all duration-300 whitespace-nowrap",
                    route.active 
                      ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <route.icon className={cn("h-5 w-5 transition-transform duration-300", route.active && "scale-110")} />
                  {route.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {!isAuthPage && (
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
               <Menu className="h-5 w-5" />
             </Button>
             <NavbarUser />
          </div>
        )}
      </div>
      
      {/* Mobile Nav - Glassmorphism Bottom Bar - Hidden as requested */}
      {!isAuthPage && (
        <div className="hidden fixed bottom-4 left-4 right-4 z-50 md:hidden safe-area-bottom">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-2 grid grid-cols-4 gap-1">
             {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  prefetch={true}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all duration-300",
                    route.active 
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  <route.icon className={cn("h-5 w-5", route.active && "fill-current")} />
                  {route.label}
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
