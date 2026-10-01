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
    <header className="h-16 shrink-0 border-b border-line flex items-center justify-between px-8 gap-6">
      <div className="flex items-center gap-2 w-full max-w-md border border-line rounded-card px-3 py-2 text-sm text-text-tertiary">
        <Search size={15} strokeWidth={1.5} />
        <input
          placeholder="Buscar clientes, projetos, conteúdos..."
          className="bg-transparent outline-none w-full placeholder:text-text-tertiary text-text"
        />
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <Bell size={18} strokeWidth={1.5} className="text-text-tertiary" />
        <button
          onClick={handleLogout}
          className="text-text-tertiary hover:text-text transition-colors"
          title="Sair"
        >
          <LogOut size={18} strokeWidth={1.5} />
        </button>
        <div className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-xs text-champagne font-medium">
          MT
        </div>
      </div>
    </header>
  );
}