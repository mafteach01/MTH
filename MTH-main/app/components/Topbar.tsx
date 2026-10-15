"use client";

import { Search, Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export function Topbar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-16 shrink-0 border-b border-line flex items-center justify-between pl-16 pr-4 md:px-8 gap-3 md:gap-6">
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md border border-line rounded-card px-3 py-2 text-sm text-text-tertiary">
        <Search size={15} strokeWidth={1.5} className="shrink-0" />
        <input
          placeholder="Buscar..."
          className="bg-transparent outline-none w-full min-w-0 placeholder:text-text-tertiary text-text"
        />
      </div>

      <div className="flex items-center gap-4 md:gap-5 shrink-0">
        <Bell size={18} strokeWidth={1.5} className="hidden sm:block text-text-tertiary" />
        <button
          onClick={handleLogout}
          className="text-text-tertiary hover:text-text transition-colors"
          title="Sair"
        >
          <LogOut size={18} strokeWidth={1.5} />
        </button>
        <div className="hidden sm:flex w-9 h-9 rounded-full bg-card border border-line items-center justify-center text-xs text-champagne font-medium">
          MT
        </div>
      </div>
    </header>
  );
}