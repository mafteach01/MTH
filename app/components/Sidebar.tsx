"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, UserRound, Shield, Settings, Menu, X, Wallet } from "lucide-react";

const nav = [
  { href: "/", label: "Visão geral", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/equipe", label: "Equipe", icon: UserRound },
  { href: "/equipes", label: "Equipes", icon: Shield },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão de menu: só aparece no celular */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 w-10 h-10 flex items-center justify-center rounded-card border border-line bg-card text-text-secondary hover:text-champagne transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      {/* Fundo escuro atrás do menu aberto (celular) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:static md:z-auto md:w-60 md:translate-x-0 md:overflow-visible shrink-0 border-r border-line bg-bg-secondary flex flex-col justify-between py-8 px-5`}
      >
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <span className="text-2xl text-champagne tracking-widest font-medium">MT</span>
            <button
              onClick={() => setOpen(false)}
              className="md:hidden text-text-tertiary hover:text-text transition-colors"
              aria-label="Fechar menu"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-card text-sm transition-colors border-l-2 ${
                    active
                      ? "border-champagne bg-card text-champagne"
                      : "border-transparent text-text-secondary hover:text-text hover:bg-card"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4 mt-10">
          <p className="text-xs text-text-tertiary leading-relaxed">
            Sua marca.
            <br />
            Novas portas.
            <br />
            Mais oportunidades.
          </p>
          <div className="border-t border-line pt-4">
            <span className="text-sm text-champagne tracking-[0.2em] font-medium">MT</span>
            <p className="text-[10px] text-text-tertiary tracking-[0.3em] mt-1">MAFTEACH</p>
          </div>
        </div>
      </aside>
    </>
  );
}