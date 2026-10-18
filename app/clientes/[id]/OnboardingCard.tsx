"use client";

import { useEffect, useState } from "react";
import { ListChecks, X } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Entry = { id: string; text: string; done: boolean; position: number };

const padrao = [
  "Contrato assinado",
  "Briefing com o cliente",
  "Acesso ao Instagram liberado",
  "Logo e identidade visual recebidos",
  "Estratégia definida",
  "Primeiro planejamento do mês",
  "Link de aprovação enviado",
  "Grupo de WhatsApp criado",
];

export function OnboardingCard({ clientId }: { clientId: string }) {
  const [supabase] = useState(() => createClient());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("mt_client_onboarding")
      .select("id, text, done, position")
      .eq("client_id", clientId)
      .order("position", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setEntries((data ?? []) as Entry[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, clientId]);

  async function usarPadrao() {
    setBusy(true);
    const { data, error } = await supabase
      .from("mt_client_onboarding")
      .insert(
        padrao.map((text, i) => ({ client_id: clientId, text, position: i }))
      )
      .select("id, text, done, position");
    setBusy(false);
    if (error || !data) {
      alert("Erro ao criar lista: " + (error?.message ?? "desconhecido"));
      return;
    }
    setEntries(
      (data as Entry[]).slice().sort((a, b) => a.position - b.position)
    );
  }

  async function adicionar() {
    const text = novo.trim();
    if (!text) return;
    const position = entries.length
      ? Math.max(...entries.map((e) => e.position)) + 1
      : 0;
    const { data, error } = await supabase
      .from("mt_client_onboarding")
      .insert({ client_id: clientId, text, position })
      .select("id, text, done, position")
      .single();
    if (error || !data) {
      alert("Erro ao adicionar: " + (error?.message ?? "desconhecido"));
      return;
    }
    setEntries((cur) => [...cur, data as Entry]);
    setNovo("");
  }

  async function alternar(e: Entry) {
    const done = !e.done;
    setEntries((cur) => cur.map((x) => (x.id === e.id ? { ...x, done } : x)));
    const { error } = await supabase
      .from("mt_client_onboarding")
      .update({ done })
      .eq("id", e.id);
    if (error) {
      setEntries((cur) =>
        cur.map((x) => (x.id === e.id ? { ...x, done: e.done } : x))
      );
      alert("Erro ao salvar: " + error.message);
    }
  }

  async function apagar(id: string) {
    const { error } = await supabase
      .from("mt_client_onboarding")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Erro ao apagar: " + error.message);
      return;
    }
    setEntries((cur) => cur.filter((x) => x.id !== id));
  }

  const feitos = entries.filter((e) => e.done).length;

  return (
    <div className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
          <ListChecks size={14} className="text-champagne" strokeWidth={1.5} />
          Entrada do cliente
        </h3>
        {entries.length > 0 && (
          <span className="text-[11px] text-text-tertiary">
            {feitos}/{entries.length}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-text-tertiary">Carregando...</p>}

      {!loading && entries.length === 0 && (
        <button
          onClick={usarPadrao}
          disabled={busy}
          className="self-start text-xs text-champagne border border-line rounded-badge px-3 py-1.5 hover:border-champagne disabled:opacity-50 transition-colors"
        >
          {busy ? "Criando..." : "Usar lista padrão"}
        </button>
      )}

      <div className="flex flex-col gap-2.5">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-2.5 text-sm min-w-0">
            <input
              type="checkbox"
              checked={e.done}
              onChange={() => alternar(e)}
              className="accent-[#D8C5A5] cursor-pointer shrink-0"
            />
            <span
              className={`flex-1 min-w-0 break-words ${
                e.done ? "line-through text-text-tertiary" : ""
              }`}
            >
              {e.text}
            </span>
            <button
              onClick={() => apagar(e.id)}
              className="text-text-tertiary hover:text-red-400 transition-colors shrink-0"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {!loading && entries.length > 0 && (
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") adicionar();
          }}
          placeholder="Adicionar item e apertar Enter"
          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
        />
      )}
    </div>
  );
}