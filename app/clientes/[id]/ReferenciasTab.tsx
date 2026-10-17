"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Trash2, User, Image as ImageIcon } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Kind = "post" | "perfil";

type Ref = {
  id: string;
  kind: Kind;
  url: string;
  title: string | null;
  note: string | null;
  created_at: string;
};

export function ReferenciasTab({ clientId }: { clientId: string }) {
  const [supabase] = useState(() => createClient());
  const [refs, setRefs] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [kind, setKind] = useState<Kind>("post");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("mt_client_references")
      .select("id, kind, url, title, note, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setRefs((data ?? []) as Ref[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, clientId]);

  async function adicionar() {
    const raw = url.trim();
    if (!raw) return;
    const link = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;

    setSaving(true);
    const { data, error } = await supabase
      .from("mt_client_references")
      .insert({
        client_id: clientId,
        kind,
        url: link,
        title: title.trim() || null,
        note: note.trim() || null,
      })
      .select("id, kind, url, title, note, created_at")
      .single();
    setSaving(false);

    if (error || !data) {
      alert("Erro ao salvar: " + (error?.message ?? "desconhecido"));
      return;
    }
    setRefs((cur) => [data as Ref, ...cur]);
    setUrl("");
    setTitle("");
    setNote("");
  }

  async function apagar(id: string) {
    if (!confirm("Apagar essa referência?")) return;
    const { error } = await supabase
      .from("mt_client_references")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Erro ao apagar: " + error.message);
      return;
    }
    setRefs((cur) => cur.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-4 min-w-0">
        <div className="flex gap-2">
          {(["post", "perfil"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`text-xs rounded-badge px-3 py-1.5 border transition-colors ${
                kind === k
                  ? "border-champagne text-champagne bg-champagne/10"
                  : "border-line text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {k === "post" ? "Post" : "Perfil"}
            </button>
          ))}
        </div>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link (instagram.com/...)"
          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome (opcional)"
          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="O que chama atenção nessa referência? (opcional)"
          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors resize-none placeholder:text-text-tertiary"
        />
        <button
          onClick={adicionar}
          disabled={saving || !url.trim()}
          className="self-end text-xs bg-champagne text-black rounded-card px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-text-tertiary">Carregando...</p>}
        {!loading && refs.length === 0 && (
          <p className="text-sm text-text-tertiary">Nenhuma referência ainda.</p>
        )}
        {refs.map((r) => (
          <div
            key={r.id}
            className="border border-line rounded-card bg-card p-4 flex items-start gap-3 min-w-0"
          >
            <div className="text-champagne shrink-0 mt-0.5">
              {r.kind === "perfil" ? (
                <User size={16} strokeWidth={1.5} />
              ) : (
                <ImageIcon size={16} strokeWidth={1.5} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm break-words">{r.title || r.url}</p>
              {r.title && (
                <p className="text-xs text-text-tertiary break-all mt-0.5">{r.url}</p>
              )}
              {r.note && (
                <p className="text-xs text-text-secondary mt-2 break-words whitespace-pre-wrap">
                  {r.note}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-tertiary hover:text-champagne transition-colors"
                title="Abrir"
              >
                <ExternalLink size={15} strokeWidth={1.5} />
              </a>
              <button
                onClick={() => apagar(r.id)}
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