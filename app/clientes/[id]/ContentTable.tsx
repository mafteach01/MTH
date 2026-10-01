"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import type { ContentItem, ContentStatus, Funil, TipoConteudo } from "./ClientDetail";
import { statusLabels } from "./ClientDetail";

const statusOrder: ContentStatus[] = ["ideia", "roteiro", "producao", "aprovacao", "publicado"];
const funilOptions: Exclude<Funil, null>[] = ["Topo", "Meio", "Final"];
const tipoOptions: Exclude<TipoConteudo, null>[] = ["Reels", "Card", "Carrossel", "Story"];

function statusBadgeClasses(status: ContentStatus) {
  switch (status) {
    case "ideia":
      return "bg-[#7C93A8]/10 text-[#9DB3C6] border-[#7C93A8]/30";
    case "roteiro":
      return "bg-[#B8836A]/10 text-[#CBA08B] border-[#B8836A]/30";
    case "producao":
      return "bg-[#C9A96E]/10 text-[#D9BF8E] border-[#C9A96E]/30";
    case "aprovacao":
      return "bg-[#8BA888]/10 text-[#A9C1A6] border-[#8BA888]/30";
    case "publicado":
      return "bg-champagne/10 text-champagne border-champagne/30";
  }
}

function funilBadgeClasses(funil: Funil) {
  switch (funil) {
    case "Topo":
      return "bg-[#7C93A8]/10 text-[#9DB3C6] border-[#7C93A8]/30";
    case "Meio":
      return "bg-[#B8836A]/10 text-[#CBA08B] border-[#B8836A]/30";
    case "Final":
      return "bg-champagne/10 text-champagne border-champagne/30";
    default:
      return "bg-card-alt text-text-tertiary border-line";
  }
}

function tipoBadgeClasses(tipo: TipoConteudo) {
  switch (tipo) {
    case "Reels":
      return "bg-[#7C93A8]/10 text-[#9DB3C6] border-[#7C93A8]/30";
    case "Card":
      return "bg-[#8BA888]/10 text-[#A9C1A6] border-[#8BA888]/30";
    case "Carrossel":
      return "bg-[#B8836A]/10 text-[#CBA08B] border-[#B8836A]/30";
    case "Story":
      return "bg-[#A78BC9]/10 text-[#C1AEDB] border-[#A78BC9]/30";
    default:
      return "bg-card-alt text-text-tertiary border-line";
  }
}

const badgeSelectBase =
  "text-xs rounded-badge px-2 py-1 border outline-none cursor-pointer appearance-none text-center";

export function ContentTable({
  items,
  onFieldChange,
  onExpand,
}: {
  items: ContentItem[];
  onFieldChange: <K extends keyof ContentItem>(id: string, field: K, value: ContentItem[K]) => void;
  onExpand: (id: string) => void;
}) {
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <p className="text-xs text-text-tertiary italic py-6 text-center">
        Nenhum conteúdo ainda. Clique em &quot;Novo conteúdo&quot; pra começar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-text-tertiary uppercase tracking-wide">
            <th className="w-8"></th>
            <th className="text-left font-normal pb-2 pr-3">Título</th>
            <th className="text-left font-normal pb-2 pr-3 w-36">Data</th>
            <th className="text-left font-normal pb-2 pr-3 w-28">Funil</th>
            <th className="text-left font-normal pb-2 pr-3 w-32">Status</th>
            <th className="text-left font-normal pb-2 w-32">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const title = titleDrafts[item.id] ?? item.title;

            return (
              <tr key={item.id} className="group border-t border-line">
                <td className="align-middle">
                  <button
                    onClick={() => onExpand(item.id)}
                    className="md:opacity-0 md:group-hover:opacity-100 text-text-tertiary hover:text-champagne transition-opacity p-2"
                    title="Abrir detalhes"
                  >
                    <Maximize2 size={13} strokeWidth={1.5} />
                  </button>
                </td>
                <td className="pr-3 py-2">
                  <input
                    value={title}
                    onChange={(e) =>
                      setTitleDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                    }
                    onBlur={() => {
                      if (title.trim() && title !== item.title) {
                        onFieldChange(item.id, "title", title.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="w-full bg-transparent outline-none rounded px-1.5 py-1 -mx-1.5 focus:bg-card-alt transition-colors"
                  />
                </td>
                <td className="pr-3 py-2">
                  <input
                    type="date"
                    value={item.scheduled_date ?? ""}
                    onChange={(e) =>
                      onFieldChange(item.id, "scheduled_date", e.target.value || null)
                    }
                    className="bg-transparent outline-none rounded px-1.5 py-1 -mx-1.5 text-xs focus:bg-card-alt transition-colors cursor-pointer [color-scheme:dark]"
                  />
                </td>
                <td className="pr-3 py-2">
                  <select
                    value={item.funil ?? ""}
                    onChange={(e) =>
                      onFieldChange(item.id, "funil", (e.target.value || null) as Funil)
                    }
                    className={`${badgeSelectBase} ${funilBadgeClasses(item.funil)}`}
                  >
                    <option value="">—</option>
                    {funilOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="pr-3 py-2">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      onFieldChange(item.id, "status", e.target.value as ContentStatus)
                    }
                    className={`${badgeSelectBase} ${statusBadgeClasses(item.status)}`}
                  >
                    {statusOrder.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <select
                    value={item.tipo_conteudo ?? ""}
                    onChange={(e) =>
                      onFieldChange(
                        item.id,
                        "tipo_conteudo",
                        (e.target.value || null) as TipoConteudo
                      )
                    }
                    className={`${badgeSelectBase} ${tipoBadgeClasses(item.tipo_conteudo)}`}
                  >
                    <option value="">—</option>
                    {tipoOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}