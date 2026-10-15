"use client";

import { useState } from "react";
import { Check, MessageSquare, Pencil, CalendarDays, Paperclip } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export type ApprovalAttachment = {
  id: string;
  name: string;
  url: string | null;
  file_path: string | null;
};

export type ApprovalItem = {
  id: string;
  title: string;
  tipo_conteudo: string | null;
  roteiro: string | null;
  legenda: string | null;
  attachments: ApprovalAttachment[];
  scheduled_date: string | null;
  scheduled_time: string | null;
  approval_status: "aprovado" | "ajuste" | null;
};

type Kind = "aprovado" | "ajuste" | "comentario";

function formatDate(iso: string | null, time: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  const base = `${d}/${m}/${y}`;
  return time ? `${base} às ${time.slice(0, 5)}` : base;
}

export function ApprovalClient({
  token,
  clientName,
  initialItems,
}: {
  token: string;
  clientName: string;
  initialItems: ApprovalItem[];
}) {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<ApprovalItem[]>(initialItems);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sentComment, setSentComment] = useState<string | null>(null);

  async function openAttachment(a: ApprovalAttachment) {
    if (a.url) {
      window.open(a.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!a.file_path) return;
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage
      .from("mt-anexos")
      .createSignedUrl(a.file_path, 300);
    if (error || !data) {
      w?.close();
      alert("Não foi possível abrir o arquivo.");
      return;
    }
    if (w) w.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  async function submit(item: ApprovalItem, kind: Kind) {
    const comment = (drafts[item.id] ?? "").trim();

    if (kind !== "aprovado" && !comment) {
      alert("Escreva um comentário antes de enviar.");
      return;
    }

    setSending(item.id);
    const { data, error } = await supabase.rpc("mt_submit_approval", {
      p_token: token,
      p_item_id: item.id,
      p_kind: kind,
      p_comment: comment || null,
    });
    setSending(null);

    if (error || !data) {
      alert("Não foi possível enviar. Tente de novo.");
      return;
    }

    setDrafts((d) => ({ ...d, [item.id]: "" }));

    if (kind === "comentario") {
      setSentComment(item.id);
      setTimeout(() => setSentComment(null), 2000);
      return;
    }

    setItems((current) =>
      current.map((i) => (i.id === item.id ? { ...i, approval_status: kind } : i))
    );
  }

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="max-w-2xl mx-auto p-4 md:p-10 flex flex-col gap-6">
        <div>
          <p className="text-xs text-champagne uppercase tracking-wide">Mafteach</p>
          <h1 className="text-2xl md:text-3xl font-medium mt-1">Aprovação de conteúdo</h1>
          <p className="text-text-secondary text-sm mt-2">
            {clientName}. Veja cada conteúdo abaixo e aprove ou peça ajuste.
          </p>
        </div>

        {items.length === 0 && (
          <div className="border border-line rounded-card bg-card p-6">
            <p className="text-sm text-text-secondary">
              Nenhum conteúdo aguardando aprovação no momento.
            </p>
          </div>
        )}

        {items.map((item) => {
          const when = formatDate(item.scheduled_date, item.scheduled_time);
          const busy = sending === item.id;
          return (
            <div
              key={item.id}
              className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {item.tipo_conteudo && (
                    <span className="text-[11px] bg-card-alt border border-line rounded-badge px-2 py-0.5 text-champagne">
                      {item.tipo_conteudo}
                    </span>
                  )}
                  {item.approval_status === "aprovado" && (
                    <span className="flex items-center gap-1 text-[11px] border border-champagne rounded-badge px-2 py-0.5 text-champagne">
                      <Check size={11} strokeWidth={1.5} />
                      Aprovado
                    </span>
                  )}
                  {item.approval_status === "ajuste" && (
                    <span className="flex items-center gap-1 text-[11px] border border-line rounded-badge px-2 py-0.5 text-text-secondary">
                      <Pencil size={11} strokeWidth={1.5} />
                      Ajuste pedido
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-medium">{item.title}</h2>
                {when && (
                  <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <CalendarDays size={12} strokeWidth={1.5} />
                    Postagem prevista: {when}
                  </p>
                )}
              </div>

              {item.roteiro && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-text-secondary">Roteiro</p>
                  <p className="text-sm bg-card-alt border border-line rounded-card p-3 whitespace-pre-wrap break-words">
                    {item.roteiro}
                  </p>
                </div>
              )}

              {item.attachments.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-text-secondary">Arquivos</p>
                  {item.attachments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => openAttachment(a)}
                      className="flex items-center gap-2 text-sm bg-card-alt border border-line rounded-card px-3 py-2 text-left hover:border-champagne transition-colors"
                    >
                      <Paperclip size={14} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                      <span className="truncate">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {item.legenda && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-text-secondary">Legenda</p>
                  <p className="text-sm bg-card-alt border border-line rounded-card p-3 whitespace-pre-wrap break-words">
                    {item.legenda}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <MessageSquare size={12} strokeWidth={1.5} />
                  Comentário
                </label>
                <textarea
                  value={drafts[item.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                  }
                  placeholder="Escreva aqui o que quer ajustar ou comentar..."
                  className="bg-card-alt border border-line rounded-card p-3 text-sm outline-none focus:border-champagne transition-colors resize-none min-h-[90px] placeholder:text-text-tertiary"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => submit(item, "aprovado")}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-sm bg-champagne text-black rounded-card px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Check size={14} strokeWidth={1.5} />
                  Aprovar
                </button>
                <button
                  onClick={() => submit(item, "ajuste")}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-sm border border-line rounded-card px-4 py-2 hover:border-champagne disabled:opacity-50 transition-colors"
                >
                  <Pencil size={14} strokeWidth={1.5} />
                  Pedir ajuste
                </button>
                <button
                  onClick={() => submit(item, "comentario")}
                  disabled={busy}
                  className="text-sm text-text-secondary hover:text-champagne px-3 py-2 disabled:opacity-50 transition-colors"
                >
                  {sentComment === item.id ? "Enviado" : "Só comentar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}