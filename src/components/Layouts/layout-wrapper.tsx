"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

export function LayoutWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, [pathname]);

  // Pages that should NOT have sidebar/navbar
  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return <>{children}</>;
  }

  // Don't render layout until auth check complete
  if (isLoading || !isAuthenticated) {
    return <>{children}</>;
  }

  // All other pages get sidebar and navbar
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="w-full flex flex-col">
        <Header />

        <main className="flex-1 px-4 md:px-6 2xl:px-10 pt-6 pb-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
