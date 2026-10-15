"use client";

import { useEffect, useState } from "react";
import { Settings, User, Bell, Shield } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import {
  pushSupported,
  getCurrentSubscription,
  enablePush,
  disablePush,
} from "@/app/lib/supabase/pushClient";

type PrefKey = "aprovacoes" | "posts_do_dia" | "novos_itens" | "notas_equipe";
type Prefs = Record<PrefKey, boolean>;

const defaultPrefs: Prefs = {
  aprovacoes: true,
  posts_do_dia: true,
  novos_itens: true,
  notas_equipe: false,
};

const prefLabels: { key: PrefKey; label: string }[] = [
  { key: "aprovacoes", label: "Cliente aprovou ou pediu ajuste" },
  { key: "posts_do_dia", label: "Posts agendados pra hoje" },
  { key: "novos_itens", label: "Novos itens no planejamento" },
  { key: "notas_equipe", label: "Notas da equipe" },
];

function Toggle({
  enabled,
  onClick,
  disabled,
}: {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-5 rounded-full relative transition-colors disabled:opacity-50 ${
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
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loaded, setLoaded] = useState(false);
  const [supported, setSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      setSupported(pushSupported());

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("mt_notification_prefs")
          .select("aprovacoes, posts_do_dia, novos_itens, notas_equipe")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setPrefs(data as Prefs);
      }

      if (pushSupported()) {
        const sub = await getCurrentSubscription();
        setPushOn(!!sub && Notification.permission === "granted");
      }

      setLoaded(true);
    }
    load();
  }, [supabase]);

  async function handleToggle(key: PrefKey) {
    if (!userId) return;
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);

    const { error } = await supabase
      .from("mt_notification_prefs")
      .upsert(
        { user_id: userId, ...next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      setPrefs(previous);
      setMsg("Não consegui salvar. Tenta de novo.");
    } else {
      setMsg("");
    }
  }

  async function handlePush() {
    setBusy(true);
    setMsg("");

    if (pushOn) {
      await disablePush();
      setPushOn(false);
    } else {
      const result = await enablePush();
      if (result === "ok") {
        setPushOn(true);
      } else if (result === "denied") {
        setMsg("Notificação bloqueada. Libera nas permissões do navegador.");
      } else {
        setMsg("Não deu pra ativar neste aparelho.");
      }
    }

    setBusy(false);
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

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-secondary">
              Notificações neste aparelho
            </p>
            {!supported && loaded && (
              <p className="text-xs text-text-tertiary">
                Este navegador não suporta notificações.
              </p>
            )}
          </div>
          <Toggle
            enabled={pushOn}
            onClick={handlePush}
            disabled={!supported || busy || !loaded}
          />
        </div>

        <div className="h-px bg-line" />

        {prefLabels.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{label}</p>
            <Toggle
              enabled={prefs[key]}
              onClick={() => handleToggle(key)}
              disabled={!loaded || !userId}
            />
          </div>
        ))}

        {msg && <p className="text-xs text-text-tertiary">{msg}</p>}
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