"use client";

import { useState } from "react";
import { X, Trash2, FileText, Copy, Check } from "lucide-react";
import type { ContentItem, ContentStatus, Funil, TipoConteudo, ChecklistEntry } from "./ClientDetail";
import { statusLabels } from "./ClientDetail";
import { AnexosConteudo } from "./AnexosConteudo";

const statusOrder: ContentStatus[] = ["ideia", "roteiro", "producao", "aprovacao", "publicado"];
const funilOptions: Exclude<Funil, null>[] = ["Topo", "Meio", "Final"];
const funilLabels: Record<Exclude<Funil, null>, string> = {
  Topo: "Topo - Atração",
  Meio: "Meio - Qualificação",
  Final: "Final - Fechamento",
};
const tipoOptions: Exclude<TipoConteudo, null>[] = ["Reels", "Card", "Carrossel", "Story"];
const checklistPadrao = ["Gravar", "Editar", "Legenda pronta", "Aprovado", "Postado"];

export function ContentDetailPanel({
  item,
  onClose,
  onFieldChange,
  onDelete,
}: {
  item: ContentItem;
  onClose: () => void;
  onFieldChange: <K extends keyof ContentItem>(id: string, field: K, value: ContentItem[K]) => void;
  onDelete: () => void;
}) {
  const [titleDraft, setTitleDraft] = useState(item.title);
  const [roteiroDraft, setRoteiroDraft] = useState(item.roteiro ?? "");
  const [legendaDraft, setLegendaDraft] = useState(item.legenda ?? "");
  const [audioDraft, setAudioDraft] = useState(item.audio ?? "");
  const [publishedUrlDraft, setPublishedUrlDraft] = useState(item.published_url ?? "");
  const [checklist, setChecklist] = useState<ChecklistEntry[]>(item.checklist ?? []);
  const [novoItem, setNovoItem] = useState("");
  const [copiado, setCopiado] = useState(false);

  function saveChecklist(next: ChecklistEntry[]) {
    setChecklist(next);
    onFieldChange(item.id, "checklist", next);
  }

  function addChecklistItem(text: string) {
    const t = text.trim();
    if (!t) return;
    saveChecklist([...checklist, { id: crypto.randomUUID(), text: t, done: false }]);
  }

  async function copiarLegenda() {
    try {
      await navigator.clipboard.writeText(legendaDraft);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  }

  const feitos = checklist.filter((c) => c.done).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-card border-l border-line h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2 text-text-tertiary">
            <FileText size={14} strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wide">Conteúdo</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDelete}
              className="text-text-tertiary hover:text-red-400 transition-colors"
              title="Apagar"
            >
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 flex-1">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              if (titleDraft.trim() && titleDraft !== item.title) {
                onFieldChange(item.id, "title", titleDraft.trim());
              }
            }}
            placeholder="Título do conteúdo"
            className="bg-transparent outline-none text-2xl font-medium placeholder:text-text-tertiary"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Data</label>
              <input
                type="date"
                value={item.scheduled_date ?? ""}
                onChange={(e) =>
                  onFieldChange(item.id, "scheduled_date", e.target.value || null)
                }
                className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Horário</label>
              <input
                type="time"
                value={item.scheduled_time ? item.scheduled_time.slice(0, 5) : ""}
                onChange={(e) =>
                  onFieldChange(item.id, "scheduled_time", e.target.value || null)
                }
                className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Status</label>
              <select
                value={item.status}
                onChange={(e) =>
                  onFieldChange(item.id, "status", e.target.value as ContentStatus)
                }
                className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
              >
                {statusOrder.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Funil</label>
              <select
                value={item.funil ?? ""}
                onChange={(e) =>
                  onFieldChange(item.id, "funil", (e.target.value || null) as Funil)
                }
                className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
              >
                <option value="">—</option>
                {funilOptions.map((f) => (
                  <option key={f} value={f}>
                    {funilLabels[f]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Tipo de conteúdo</label>
              <select
                value={item.tipo_conteudo ?? ""}
                onChange={(e) =>
                  onFieldChange(
                    item.id,
                    "tipo_conteudo",
                    (e.target.value || null) as TipoConteudo
                  )
                }
                className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
              >
                <option value="">—</option>
                {tipoOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {item.status === "publicado" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-line rounded-card p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">Data da postagem</label>
                <input
                  type="date"
                  value={item.published_at ?? ""}
                  onChange={(e) =>
                    onFieldChange(item.id, "published_at", e.target.value || null)
                  }
                  className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">Link do post</label>
                <input
                  value={publishedUrlDraft}
                  onChange={(e) => setPublishedUrlDraft(e.target.value)}
                  onBlur={() => {
                    if (publishedUrlDraft !== (item.published_url ?? "")) {
                      onFieldChange(item.id, "published_url", publishedUrlDraft.trim() || null);
                    }
                  }}
                  placeholder="https://instagram.com/p/..."
                  className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Roteiro</label>
            <textarea
              value={roteiroDraft}
              onChange={(e) => setRoteiroDraft(e.target.value)}
              onBlur={() => {
                if (roteiroDraft !== (item.roteiro ?? "")) {
                  onFieldChange(item.id, "roteiro", roteiroDraft || null);
                }
              }}
              placeholder="Escreva o roteiro, ideias, referências..."
              className="bg-card-alt border border-line rounded-card p-3 text-sm outline-none focus:border-champagne transition-colors resize-none min-h-[240px] placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary">Legenda</label>
              <button
                onClick={copiarLegenda}
                disabled={!legendaDraft}
                className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-champagne transition-colors disabled:opacity-40"
              >
                {copiado ? (
                  <Check size={12} strokeWidth={1.5} />
                ) : (
                  <Copy size={12} strokeWidth={1.5} />
                )}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
            <textarea
              value={legendaDraft}
              onChange={(e) => setLegendaDraft(e.target.value)}
              onBlur={() => {
                if (legendaDraft !== (item.legenda ?? "")) {
                  onFieldChange(item.id, "legenda", legendaDraft || null);
                }
              }}
              placeholder="Legenda do post..."
              className="bg-card-alt border border-line rounded-card p-3 text-sm outline-none focus:border-champagne transition-colors resize-none min-h-[120px] placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Áudio</label>
            <input
              value={audioDraft}
              onChange={(e) => setAudioDraft(e.target.value)}
              onBlur={() => {
                if (audioDraft !== (item.audio ?? "")) {
                  onFieldChange(item.id, "audio", audioDraft || null);
                }
              }}
              placeholder="Nome da música ou link do áudio"
              className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary">Checklist</label>
              {checklist.length > 0 && (
                <span className="text-[11px] text-text-tertiary">
                  {feitos}/{checklist.length}
                </span>
              )}
            </div>

            {checklist.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={c.done}
                  onChange={() =>
                    saveChecklist(
                      checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x))
                    )
                  }
                  className="accent-[#D8C5A5] cursor-pointer"
                />
                <span
                  className={`flex-1 min-w-0 ${
                    c.done ? "line-through text-text-tertiary" : ""
                  }`}
                >
                  {c.text}
                </span>
                <button
                  onClick={() => saveChecklist(checklist.filter((x) => x.id !== c.id))}
                  className="text-text-tertiary hover:text-red-400 transition-colors"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}

            <input
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addChecklistItem(novoItem);
                  setNovoItem("");
                }
              }}
              placeholder="Adicionar item e apertar Enter"
              className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
            />

            {checklist.length === 0 && (
              <button
                onClick={() =>
                  saveChecklist(
                    checklistPadrao.map((t) => ({
                      id: crypto.randomUUID(),
                      text: t,
                      done: false,
                    }))
                  )
                }
                className="self-start text-[11px] text-text-tertiary hover:text-champagne transition-colors"
              >
                Usar checklist padrão (Gravar, Editar, Legenda, Aprovado, Postado)
              </button>
            )}
          </div>

          <AnexosConteudo itemId={item.id} />
        </div>
      </div>
    </div>
  );
}