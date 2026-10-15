"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type ClientHit = { id: string; name: string };

export function Topbar() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const safe = term.replace(/[%,()]/g, " ");
      const { data } = await supabase
        .from("mt_clients")
        .select("id, name")
        .ilike("name", `%${safe}%`)
        .order("name")
        .limit(6);
      if (!cancelled) {
        setResults(data ?? []);
        setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, supabase]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent | TouchEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, []);

  function goTo(id: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/clientes/${id}`);
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <header className="h-16 shrink-0 border-b border-line flex items-center justify-between pl-16 pr-4 md:px-8 gap-3 md:gap-6">
      <div ref={boxRef} className="relative flex-1 min-w-0 max-w-md">
        <div className="flex items-center gap-2 border border-line rounded-card px-3 py-2 text-sm text-text-tertiary">
          <Search size={15} strokeWidth={1.5} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) goTo(results[0].id);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Buscar cliente..."
            className="bg-transparent outline-none w-full min-w-0 placeholder:text-text-tertiary text-text"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 border border-line rounded-card bg-card overflow-hidden">
            {searching && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-tertiary">Buscando...</p>
            )}
            {!searching && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-tertiary">
                Nenhum cliente encontrado.
              </p>
            )}
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => goTo(c.id)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-card-alt hover:text-champagne transition-colors border-b border-line last:border-b-0"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
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