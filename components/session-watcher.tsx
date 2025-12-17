'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function SessionWatcher() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 如果正在加载 session，不执行任何操作
    if (status === "loading") return;

    // 定义不需要鉴权的公开路径
    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

    // 如果未登录且当前不在公开页面，强制跳转到登录页
    if (status === "unauthenticated" && !isPublicPath) {
      console.log("Session expired or invalid, performing signout...");
      // 使用 signOut 清除本地 Cookie，防止 Middleware 死循环
      // redirect: true 会自动跳转到登录页（默认行为）
      signOut({ callbackUrl: '/login' });
    }
  }, [session, status, router, pathname]);

  return null;
}