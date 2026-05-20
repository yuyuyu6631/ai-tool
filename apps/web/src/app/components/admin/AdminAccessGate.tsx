"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { withPublicPath } from "../../lib/public-path";

export default function AdminAccessGate({
  children,
  redirectPath = "/admin",
}: {
  children: ReactNode;
  redirectPath?: string;
}) {
  const { currentUser, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest" && !currentUser) {
      router.replace(withPublicPath(`/auth?next=${encodeURIComponent(withPublicPath(redirectPath))}`));
    }
  }, [currentUser, redirectPath, router, status]);

  if (status === "loading") {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500">正在验证后台权限...</div>;
  }

  if (status === "guest" || !currentUser) {
    return null;
  }

  if (!["admin", "operator", "administrator"].includes(currentUser.role ?? "")) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-600">当前账号没有后台权限，请使用管理员账号登录。</div>;
  }

  return <>{children}</>;
}
