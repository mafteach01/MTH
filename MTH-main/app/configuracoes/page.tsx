"use client";

import { useState } from "react";
import { Settings, User, Bell, Shield } from "lucide-react";

type ToggleKey = "novosItens" | "notasEquipe";

function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-5 rounded-full relative transition-colors ${
        enabled ? "bg-champagne" : "bg-card-alt border border-line"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
          enabled ? "bg-black right-0.5" : "bg-text-tertiary left-0.5"
        }`}
      />
    </button>
  );
}

export default function ConfiguracoesPage() {
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    novosItens: true,
    notasEquipe: false,
  });

  function handleToggle(key: ToggleKey) {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="p-10 flex flex-col gap-8 max-w-2xl">
      <h2 className="flex items-center gap-2 text-3xl font-medium">
        <Settings size={22} className="text-champagne" strokeWidth={1.5} />
        Configurações
      </h2>

      <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide mb-2">
          <User size={14} className="text-champagne" strokeWidth={1.5} />
          Perfil
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-card-alt border border-line flex items-center justify-center text-champagne font-medium">
            MT
          </div>
          <div>
            <p className="font-medium">Equipe Mafteach</p>
            <p className="text-xs text-text-secondary">contato@mafteach.com</p>
          </div>
        </div>
      </div>

      <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide mb-2">
          <Bell size={14} className="text-champagne" strokeWidth={1.5} />
          Notificações
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">Novos itens no planejamento</p>
          <Toggle
            enabled={toggles.novosItens}
            onClick={() => handleToggle("novosItens")}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">Notas da equipe</p>
          <Toggle
            enabled={toggles.notasEquipe}
            onClick={() => handleToggle("notasEquipe")}
          />
        </div>
      </div>

      <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide mb-2">
          <Shield size={14} className="text-champagne" strokeWidth={1.5} />
          Segurança
        </h3>
        <button className="text-sm text-left text-text-secondary hover:text-champagne w-fit">
          Alterar senha
        </button>
      </div>
    </div>
  );
}