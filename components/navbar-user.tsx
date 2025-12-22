'use client';

import { Users, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "@/app/actions/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function NavbarUser() {
  const [user, setUser] = useState<{ name: string | null; email: string | null; image: string | null } | null>(null);

  useEffect(() => {
    getCurrentUser().then((u: any) => setUser(u));
  }, []);

  // Listen for focus events to re-fetch user data when tab becomes active
  useEffect(() => {
    const onFocus = () => {
      getCurrentUser().then((u: any) => setUser(u));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!user) {
    return (
        <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                登录
            </Link>
        </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 group outline-none">
            <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-medium leading-none text-foreground/90 group-hover:text-primary transition-colors">
                {user.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                {user.email}
                </span>
            </div>
            <Avatar className="h-9 w-9 border transition-all group-hover:ring-2 group-hover:ring-primary/20">
                <AvatarImage 
                  src={user.image || undefined} 
                  alt={user.name || '用户头像'}
                  priority
                />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    {user.name?.[0]?.toUpperCase() || <Users className="h-4 w-4" />}
                </AvatarFallback>
            </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>我的账号</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>个人资料</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>设置</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={async () => {
            await logoutUser();
            // Client side navigation or reload handled by signOut usually, but to be safe:
            // window.location.href = "/";
        }}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
