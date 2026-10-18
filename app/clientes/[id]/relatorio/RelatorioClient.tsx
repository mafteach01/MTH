"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Trophy } from "lucide-react";

export type ReportItem = {
  id: string;
  title: string;
  tipo_conteudo: string | null;
  published_at: string;
  published_url: string | null;
  metric_reach: number | null;
  metric_saves: number | null;
  metric_shares: number | null;
  metric_clicks: number | null;
  metric_watch_seconds: number | null;
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n: number | null) {
  return n == null ? "—" : n.toLocaleString("pt-BR");
}

function fmtTempo(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}min${String(r).padStart(2, "0")}s` : `${r}s`;
}

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function RelatorioClient({
  clientId,
  clientName,
  instagramHandle,
  items,
}: {
  clientId: string;
  clientName: string;
  instagramHandle: string | null;
  items: ReportItem[];
}) {
  const [month, setMonth] = useState(currentMonth());

  const monthItems = useMemo(
    () => items.filter((i) => i.published_at.startsWith(month)),
    [items, month]
  );

  const totals = useMemo(
    () =>
      monthItems.reduce(
        (acc, i) => ({
          reach: acc.reach + (i.metric_reach ?? 0),
          saves: acc.saves + (i.metric_saves ?? 0),
          shares: acc.shares + (i.metric_shares ?? 0),
          clicks: acc.clicks + (i.metric_clicks ?? 0),
        }),
        { reach: 0, saves: 0, shares: 0, clicks: 0 }
      ),
    [monthItems]
  );

  const tempoMedio = useMemo(() => {
    const vals = monthItems
      .map((i) => i.metric_watch_seconds)
      .filter((v): v is number => v != null && v > 0);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [monthItems]);

  const best = useMemo(() => {
    let b: ReportItem | null = null;
    for (const i of monthItems) {
      if (i.metric_reach == null) continue;
      if (!b || i.metric_reach > (b.metric_reach ?? 0)) b = i;
    }
    return b;
  }, [monthItems]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of monthItems) {
      const k = i.tipo_conteudo ?? "Sem tipo";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [monthItems]);

  const [yy, mm] = month.split("-");
  const monthLabel = `${monthNames[Number(mm) - 1]} de ${yy}`;

  useEffect(() => {
    const previous = document.title;
    document.title = `Relatório ${clientName} - ${monthLabel}`;
    return () => {
      document.title = previous;
    };
  }, [clientName, monthLabel]);

  const stats = [
    { label: "Posts publicados", value: monthItems.length.toLocaleString("pt-BR") },
    { label: "Visualizações", value: totals.reach.toLocaleString("pt-BR") },
    { label: "Salvamentos", value: totals.saves.toLocaleString("pt-BR") },
    { label: "Compartilhamentos", value: totals.shares.toLocaleString("pt-BR") },
    { label: "Curtidas", value: totals.clicks.toLocaleString("pt-BR") },
    {
      label: "Tempo médio assistido",
      value: tempoMedio == null ? "—" : fmtTempo(tempoMedio),
    },
  ];

  return (
    <div className="report-root p-4 md:p-10 flex flex-col gap-6 md:gap-8 max-w-5xl mx-auto w-full">
      <style>{`
        @media print {
          @page { margin: 14mm; }
          html, body { background: #fff !important; }
          .report-root, .report-root * {
            color: #111 !important;
            background: transparent !important;
            border-color: #ccc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .report-root { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <Link
        href={`/clientes/${clientId}`}
        className="no-print flex items-center gap-2 text-sm text-text-secondary hover:text-champagne w-fit"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        {clientName}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-champagne uppercase tracking-wide">
            Mafteach · Relatório mensal
          </p>
          <h1 className="text-2xl md:text-3xl font-medium mt-1">{clientName}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {instagramHandle ? `${instagramHandle} · ` : ""}
            {monthLabel}
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer [color-scheme:dark]"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm bg-champagne text-black rounded-card px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <Printer size={14} strokeWidth={1.5} />
            Baixar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-line rounded-card bg-card p-4">
            <p className="text-xs text-text-secondary">{s.label}</p>
            <p className="text-2xl mt-1 font-medium">{s.value}</p>
          </div>
        ))}
      </div>

      {monthItems.length === 0 ? (
        <div className="border border-line rounded-card bg-card p-6">
          <p className="text-sm text-text-secondary">
            Nenhum post publicado em {monthLabel}. Os posts entram aqui pela data da postagem.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {best && (
              <div className="border border-line rounded-card bg-card p-4 flex flex-col gap-1.5">
                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Trophy size={13} strokeWidth={1.5} className="text-champagne" />

                </p>
                <p className="text-base font-medium break-words">{best.title}</p>
                <p className="text-sm text-champagne">
                  {fmt(best.metric_reach)} visualizações · {fmtDate(best.published_at)}
                </p>
              </div>
            )}
            <div className="border border-line rounded-card bg-card p-4 flex flex-col gap-1.5">
              <p className="text-xs text-text-secondary">Posts por formato</p>
              <div className="flex flex-wrap gap-2">
                {byType.map(([tipo, count]) => (
                  <span
                    key={tipo}
                    className="text-xs bg-card-alt border border-line rounded-badge px-2 py-1"
                  >
                    {tipo} <span className="text-champagne">· {count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-line rounded-card bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-text-tertiary text-xs border-b border-line">
                  <th className="p-3 font-normal">Data</th>
                  <th className="p-3 font-normal">Conteúdo</th>
                  <th className="p-3 font-normal text-right">Visual.</th>
                  <th className="p-3 font-normal text-right">Salv.</th>
                  <th className="p-3 font-normal text-right">Comp.</th>
                  <th className="p-3 font-normal text-right">Curtidas</th>
                  <th className="p-3 font-normal text-right">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {monthItems.map((i) => (
                  <tr key={i.id}>
                    <td className="p-3 text-text-secondary whitespace-nowrap">
                      {fmtDate(i.published_at)}
                    </td>
                    <td className="p-3">
                      <p className="break-words">{i.title}</p>
                      <p className="text-xs text-text-tertiary">
                        {i.tipo_conteudo ?? "—"}
                        {i.published_url ? (
                          <>
                            {" · "}
                            <a
                              href={i.published_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-champagne"
                            >
                              ver post
                            </a>
                          </>
                        ) : null}
                      </p>
                    </td>
                    <td className="p-3 text-right">{fmt(i.metric_reach)}</td>
                    <td className="p-3 text-right">{fmt(i.metric_saves)}</td>
                    <td className="p-3 text-right">{fmt(i.metric_shares)}</td>
                    <td className="p-3 text-right">{fmt(i.metric_clicks)}</td>
                    <td className="p-3 text-right">
                      {i.metric_watch_seconds ? fmtTempo(i.metric_watch_seconds) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}