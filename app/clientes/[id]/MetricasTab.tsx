"use client";

import { useState } from "react";
import type { ContentItem } from "./ClientDetail";

type Key = "metric_reach" | "metric_saves" | "metric_shares" | "metric_clicks";

const metricas: { key: Key; label: string }[] = [
  { key: "metric_reach", label: "Alcance" },
  { key: "metric_saves", label: "Salvamentos" },
  { key: "metric_shares", label: "Compartilhamentos" },
  { key: "metric_clicks", label: "Cliques" },
];

const mesesCurtos = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function chaveMes(item: ContentItem) {
  const d = item.published_at ?? item.scheduled_date;
  return d ? d.slice(0, 7) : null;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

export function MetricasTab({
  items,
  onExpand,
}: {
  items: ContentItem[];
  onExpand: (id: string) => void;
}) {
  const [key, setKey] = useState<Key>("metric_reach");

  const hoje = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: mesesCurtos[d.getMonth()],
    };
  });

  const valores = meses.map((m) =>
    items
      .filter((it) => chaveMes(it) === m.key)
      .reduce((soma, it) => soma + (it[key] ?? 0), 0)
  );
  const max = Math.max(...valores, 1);
  const total = valores.reduce((a, b) => a + b, 0);

  const top = items
    .filter((it) => (it[key] ?? 0) > 0)
    .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
    .slice(0, 5);

  const label = metricas.find((m) => m.key === key)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {metricas.map((m) => (
          <button
            key={m.key}
            onClick={() => setKey(m.key)}
            className={`text-xs rounded-badge px-3 py-1.5 border transition-colors ${
              key === m.key
                ? "border-champagne text-champagne bg-champagne/10"
                : "border-line text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-4 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs text-text-tertiary uppercase tracking-wide">
            {label} · últimos 6 meses
          </h3>
          <span className="text-sm text-champagne">{fmt(total)}</span>
        </div>

        {total === 0 ? (
          <p className="text-sm text-text-tertiary">
            Ainda sem métricas. Preenche nos conteúdos publicados e elas aparecem aqui.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              {valores.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 text-center text-[10px] md:text-xs text-text-secondary truncate"
                >
                  {v > 0 ? fmt(v) : ""}
                </div>
              ))}
            </div>
            <div className="h-40 flex items-end gap-2 border-b border-line">
              {valores.map((v, i) => (
                <div key={i} className="flex-1 h-full flex items-end justify-center">
                  <div
                    className="w-full max-w-12 bg-champagne/70 rounded-t"
                    style={{
                      height: v > 0 ? `${Math.max(Math.round((v / max) * 100), 3)}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {meses.map((m) => (
                <div
                  key={m.key}
                  className="flex-1 text-center text-[10px] md:text-xs text-text-tertiary"
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-3 min-w-0">
        <h3 className="text-xs text-text-tertiary uppercase tracking-wide">
          Top 5 · {label}
        </h3>
        {top.length === 0 && (
          <p className="text-sm text-text-tertiary">Nenhum conteúdo com métrica ainda.</p>
        )}
        {top.map((it, i) => (
          <button
            key={it.id}
            onClick={() => onExpand(it.id)}
            className="flex items-center gap-3 text-left border border-line rounded-card bg-card-alt px-3 py-2.5 hover:border-champagne transition-colors min-w-0"
          >
            <span className="text-xs text-text-tertiary w-4 shrink-0">{i + 1}</span>
            <span className="flex-1 min-w-0 text-sm break-words">{it.title}</span>
            <span className="text-sm text-champagne shrink-0">{fmt(it[key] ?? 0)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}