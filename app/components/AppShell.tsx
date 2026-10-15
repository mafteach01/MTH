"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const noShellRoutes = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell =
    noShellRoutes.includes(pathname) ||
    pathname.startsWith("/aprovar/") ||
    (pathname.startsWith("/clientes/") && pathname.endsWith("/relatorio"));

    if (hideShell) {
    return <div className="flex-1 w-full">{children}</div>;
  }

  return (
    <div className="flex-1 flex min-w-0 w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}