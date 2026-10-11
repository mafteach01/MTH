"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, File as FileIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Attachment = {
  id: string;
  kind: string;
  name: string;
  url: string | null;
  file_path: string | null;
  file_size: number | null;
};

const MAX_FILE = 50 * 1024 * 1024;
const TOTAL_LIMIT = 1024 * 1024 * 1024;
const COLS = "id, kind, name, url, file_path, file_size";

const groups = [
  { kind: "bruto", label: "Bruto", hint: "O que foi gravado" },
  { kind: "edicao", label: "Para edição", hint: "Vídeos, áudios e imagens que entram na edição" },
  { kind: "final", label: "Final", hint: "Vídeo editado, pronto pra postar" },
];

function formatSize(bytes: number | null) {
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export function AnexosConteudo({ itemId }: { itemId: string }) {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Attachment[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkKind, setLinkKind] = useState<string | null>(null);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("mt_content_attachments")
        .select(COLS)
        .eq("content_item_id", itemId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) setError("Não consegui carregar os anexos.");
      setItems((data ?? []) as Attachment[]);
      setLoading(false);

      const { data: usage } = await supabase
        .from("mt_content_attachments")
        .select("file_size")
        .not("file_path", "is", null);
      if (cancelled) return;
      setUsedBytes((usage ?? []).reduce((s, r) => s + (r.file_size ?? 0), 0));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [itemId, supabase]);

  async function addLink(kind: string) {
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    let name = linkName.trim();
    if (!name) {
      try {
        name = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        name = "Link";
      }
    }
    setError(null);
    const { data, error } = await supabase
      .from("mt_content_attachments")
      .insert({ content_item_id: itemId, kind, name, url })
      .select(COLS)
      .single();
    if (error || !data) {
      setError("Não consegui salvar o link.");
      return;
    }
    setItems((prev) => [...prev, data as Attachment]);
    setLinkKind(null);
    setLinkName("");
    setLinkUrl("");
  }

  async function uploadFile(kind: string, file: File) {
    setError(null);
    if (file.size > MAX_FILE) {
      setError(
        `"${file.name}" tem ${formatSize(file.size)} e passa de 50 MB. Suba no Drive e cole o link aqui.`
      );
      return;
    }
    if (usedBytes + file.size > TOTAL_LIMIT) {
      setError("Esse arquivo estouraria o 1 GB de espaço. Use um link do Drive.");
      return;
    }
    setBusyKind(kind);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${itemId}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("mt-anexos")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setError("Não consegui enviar o arquivo.");
      setBusyKind(null);
      return;
    }
    const { data, error: insErr } = await supabase
      .from("mt_content_attachments")
      .insert({
        content_item_id: itemId,
        kind,
        name: file.name,
        file_path: path,
        file_size: file.size,
      })
      .select(COLS)
      .single();
    if (insErr || !data) {
      await supabase.storage.from("mt-anexos").remove([path]);
      setError("Enviei o arquivo mas não consegui registrar. Tente de novo.");
      setBusyKind(null);
      return;
    }
    setItems((prev) => [...prev, data as Attachment]);
    setUsedBytes((u) => u + file.size);
    setBusyKind(null);
  }

  async function openItem(a: Attachment) {
    if (a.url) {
      window.open(a.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!a.file_path) return;
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage
      .from("mt-anexos")
      .createSignedUrl(a.file_path, 120);
    if (error || !data) {
      w?.close();
      setError("Não consegui abrir o arquivo.");
      return;
    }
    if (w) w.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  async function removeItem(a: Attachment) {
    if (!confirm(`Apagar "${a.name}"?`)) return;
    if (a.file_path) await supabase.storage.from("mt-anexos").remove([a.file_path]);
    const { error } = await supabase.from("mt_content_attachments").delete().eq("id", a.id);
    if (error) {
      setError("Não consegui apagar.");
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== a.id));
    if (a.file_path && a.file_size) setUsedBytes((u) => Math.max(0, u - (a.file_size ?? 0)));
  }

  const pct = usedBytes / TOTAL_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary">Anexos</label>
        <span
          className={`text-[11px] ${
            pct >= 0.95 ? "text-red-400" : pct >= 0.8 ? "text-champagne" : "text-text-tertiary"
          }`}
        >
          Uploads: {formatSize(usedBytes)} de 1 GB
        </span>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {loading ? (
        <p className="text-xs text-text-tertiary">Carregando...</p>
      ) : (
        groups.map((g) => {
          const list = items.filter((a) => a.kind === g.kind);
          return (
            <div
              key={g.kind}
              className="bg-card-alt border border-line rounded-card p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm">{g.label}</p>
                  <p className="text-[11px] text-text-tertiary truncate">{g.hint}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setLinkKind(linkKind === g.kind ? null : g.kind);
                      setLinkName("");
                      setLinkUrl("");
                    }}
                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-text border border-line rounded-card px-2.5 py-1.5 transition-colors"
                  >
                    <Link2 size={13} strokeWidth={1.5} />
                    Link
                  </button>
                  <button
                    onClick={() => fileRefs.current[g.kind]?.click()}
                    disabled={busyKind !== null}
                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-text border border-line rounded-card px-2.5 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {busyKind === g.kind ? (
                      <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    ) : (
                      <Upload size={13} strokeWidth={1.5} />
                    )}
                    Arquivo
                  </button>
                  <input
                    ref={(el) => {
                      fileRefs.current[g.kind] = el;
                    }}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) uploadFile(g.kind, f);
                    }}
                  />
                </div>
              </div>

              {linkKind === g.kind && (
                <div className="flex flex-col gap-2 border-t border-line pt-2">
                  <input
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Nome (opcional)"
                    className="bg-card border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
                  />
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLink(g.kind)}
                    placeholder="Cole o link (Drive, etc.)"
                    className="bg-card border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
                  />
                  <button
                    onClick={() => addLink(g.kind)}
                    className="self-end text-xs border border-line rounded-card px-3 py-1.5 text-champagne hover:border-champagne transition-colors"
                  >
                    Salvar link
                  </button>
                </div>
              )}

              {list.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  {a.file_path ? (
                    <FileIcon size={14} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                  ) : (
                    <Link2 size={14} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                  )}
                  <button
                    onClick={() => openItem(a)}
                    className="flex-1 min-w-0 text-left truncate hover:text-champagne transition-colors"
                  >
                    {a.name}
                  </button>
                  {a.file_size ? (
                    <span className="text-[11px] text-text-tertiary shrink-0">
                      {formatSize(a.file_size)}
                    </span>
                  ) : null}
                  <button
                    onClick={() => removeItem(a)}
                    className="text-text-tertiary hover:text-red-400 transition-colors shrink-0"
                    title="Apagar"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}