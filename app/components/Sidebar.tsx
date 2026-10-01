"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, UserRound, Shield } from "lucide-react";

const nav = [
  { href: "/", label: "Visão geral", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/equipe", label: "Equipe", icon: UserRound },
  { href: "/equipes", label: "Equipes", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-bg-secondary flex flex-col justify-between py-8 px-5">
      <div className="flex flex-col gap-10">
        <span className="text-2xl text-champagne tracking-widest font-medium">MT</span>

        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-card text-sm transition-colors border-l-2 ${
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

      <div className="flex flex-col gap-4">
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
  );
}