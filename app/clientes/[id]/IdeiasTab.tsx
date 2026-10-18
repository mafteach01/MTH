"use client";

import { useEffect, useState } from "react";
import { Trash2, ArrowRightCircle } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Idea = { id: string; text: string; created_at: string };

export function IdeiasTab({
  clientId,
  onConvert,
}: {
  clientId: string;
  onConvert: (text: string) => Promise<boolean>;
}) {
  const [supabase] = useState(() => createClient());
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("mt_client_ideas")
      .select("id, text, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setIdeas((data ?? []) as Idea[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, clientId]);

  async function adicionar() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("mt_client_ideas")
      .insert({ client_id: clientId, text })
      .select("id, text, created_at")
      .single();
    setSaving(false);
    if (error || !data) {
      alert("Erro ao salvar: " + (error?.message ?? "desconhecido"));
      return;
    }
    setIdeas((cur) => [data as Idea, ...cur]);
    setDraft("");
  }

  async function apagar(id: string) {
    if (!confirm("Apagar essa ideia?")) return;
    const { error } = await supabase.from("mt_client_ideas").delete().eq("id", id);
    if (error) {
      alert("Erro ao apagar: " + error.message);
      return;
    }
    setIdeas((cur) => cur.filter((i) => i.id !== id));
  }

  async function virarConteudo(idea: Idea) {
    setBusyId(idea.id);
    const ok = await onConvert(idea.text);
    if (ok) {
      await supabase.from("mt_client_ideas").delete().eq("id", idea.id);
      setIdeas((cur) => cur.filter((i) => i.id !== idea.id));
    }
    setBusyId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-3 min-w-0">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Anota uma ideia solta..."
          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors resize-none placeholder:text-text-tertiary"
        />
        <button
          onClick={adicionar}
          disabled={saving || !draft.trim()}
          className="self-end text-xs bg-champagne text-black rounded-card px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-text-tertiary">Carregando...</p>}
        {!loading && ideas.length === 0 && (
          <p className="text-sm text-text-tertiary">Nenhuma ideia ainda.</p>
        )}
        {ideas.map((i) => (
          <div
            key={i.id}
            className="border border-line rounded-card bg-card p-4 flex items-start gap-3 min-w-0"
          >
            <p className="flex-1 min-w-0 text-sm break-words whitespace-pre-wrap">
              {i.text}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => virarConteudo(i)}
                disabled={busyId === i.id}
                className="flex items-center gap-1 text-[11px] text-champagne hover:opacity-80 disabled:opacity-50 transition-opacity"
                title="Virar conteúdo"
              >
                <ArrowRightCircle size={15} strokeWidth={1.5} />
                Virar conteúdo
              </button>
              <button
                onClick={() => apagar(i.id)}
                className="text-text-tertiary hover:text-red-400 transition-colors"
                title="Apagar"
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}