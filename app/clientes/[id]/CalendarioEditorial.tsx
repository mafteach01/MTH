"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { ContentItem, Funil } from "./ClientDetail";
import { statusLabels } from "./ClientDetail";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const funilLabels: Record<Exclude<Funil, null>, string> = {
  Topo: "Topo - Atração",
  Meio: "Meio - Qualificação",
  Final: "Final - Fechamento",
};

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function ddmmFromIso(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarioEditorial({
  items,
  onCreate,
  onExpand,
  onMove,
}: {
  items: ContentItem[];
  onCreate: (isoDate: string) => void;
  onExpand: (id: string) => void;
  onMove: (id: string, isoDate: string) => void;
}) {
  const now = new Date();
  const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate());

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIso, setOverIso] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const cells = getMonthGrid(year, month);
  const itemsWithoutDate = items.filter((i) => !i.scheduled_date);
  const selectedItems = selectedIso
    ? items.filter((it) => it.scheduled_date === selectedIso)
    : [];

  function goPrev() {
    setSelectedIso(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    setSelectedIso(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToday() {
    setSelectedIso(null);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  function renderChip(item: ContentItem) {
    return (
      <button
        key={item.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          setDragId(item.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setOverIso(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onExpand(item.id);
        }}
        className={`text-left w-full bg-card-alt border border-line rounded-card px-3 py-2.5 hover:border-champagne transition-colors cursor-grab active:cursor-grabbing ${
          dragId === item.id ? "opacity-40" : ""
        }`}
      >
        <p className="text-sm text-text leading-snug break-words">{item.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-xs text-champagne">{statusLabels[item.status]}</span>
          {item.funil && (
            <span
              className={`text-[11px] rounded-badge px-2 py-0.5 border ${funilBadgeClasses(item.funil)}`}
            >
              {funilLabels[item.funil]}
            </span>
          )}
        </div>
        {item.tipo_conteudo && (
          <p className="text-[11px] text-text-tertiary mt-1.5">{item.tipo_conteudo}</p>
        )}
        {item.roteiro && (
          <p className="text-xs text-text-secondary mt-2 line-clamp-3 whitespace-pre-line break-words">
            {item.roteiro}
          </p>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="hidden md:flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
          <CalendarDays size={14} className="text-champagne" strokeWidth={1.5} />
          Calendário editorial
        </h3>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={goToday}
            className="text-xs text-text-secondary hover:text-champagne transition-colors px-2"
          >
            Hoje
          </button>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center rounded-card border border-line hover:border-line-strong transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
            <p className="text-sm text-text-secondary w-32 md:w-36 text-center">
              {monthNames[month]} {year}
            </p>
            <button
              onClick={goNext}
              className="w-8 h-8 flex items-center justify-center rounded-card border border-line hover:border-line-strong transition-colors"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="border border-line rounded-card bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 md:p-3 text-[10px] md:text-xs text-text-tertiary uppercase tracking-wide text-center"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const iso = day !== null ? toIso(year, month, day) : null;
            const dayItems = iso ? items.filter((it) => it.scheduled_date === iso) : [];
            const isToday = iso === todayIso;
            const isOver = iso !== null && overIso === iso;
            const isSelected = iso !== null && iso === selectedIso;

            return (
              <div
                key={i}
                onClick={() => {
                  if (!iso) return;
                  if (isMobile) setSelectedIso(isSelected ? null : iso);
                  else onCreate(iso);
                }}
                onDragOver={(e) => {
                  if (!iso) return;
                  e.preventDefault();
                  setOverIso(iso);
                }}
                onDragLeave={() => setOverIso((cur) => (cur === iso ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (iso && dragId) onMove(dragId, iso);
                  setDragId(null);
                  setOverIso(null);
                }}
                className={`min-h-16 md:min-h-44 min-w-0 border-b border-line p-1 md:p-2 flex flex-col items-center md:items-stretch gap-1 md:gap-1.5 transition-colors ${
                  i % 7 !== 6 ? "border-r" : ""
                } ${day !== null ? "cursor-pointer hover:bg-card-alt/40" : ""} ${
                  isOver || isSelected ? "bg-card-alt" : ""
                }`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`text-xs w-fit ${
                        isToday
                          ? "text-champagne border border-champagne rounded-badge px-1.5"
                          : "text-text-tertiary"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Celular: só bolinhas */}
                    <div className="flex md:hidden flex-wrap justify-center gap-0.5">
                      {dayItems.slice(0, 3).map((it) => (
                        <span key={it.id} className="w-1.5 h-1.5 rounded-full bg-champagne" />
                      ))}
                      {dayItems.length > 3 && (
                        <span className="text-[9px] leading-none text-champagne">
                          +{dayItems.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Computador: cards completos */}
                    <div className="hidden md:flex flex-col gap-1">
                      {dayItems.map(renderChip)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Celular: lista do dia selecionado */}
      {selectedIso ? (
        <div className="md:hidden border border-line rounded-card bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-tertiary uppercase tracking-wide">
              Dia {ddmmFromIso(selectedIso)}
            </p>
            <button
              onClick={() => onCreate(selectedIso)}
              className="text-xs bg-champagne text-black rounded-card px-3 py-1.5 hover:opacity-90"
            >
              Novo conteúdo
            </button>
          </div>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-text-tertiary">Nada agendado nesse dia ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">{selectedItems.map(renderChip)}</div>
          )}
        </div>
      ) : (
        <p className="md:hidden text-xs text-text-tertiary text-center">
          Toque num dia pra ver ou criar conteúdo.
        </p>
      )}

      {itemsWithoutDate.length > 0 && (
        <div className="border border-line rounded-card bg-card p-4">
          <p className="text-xs text-text-tertiary uppercase tracking-wide mb-3">
            Sem data · arraste pra um dia
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {itemsWithoutDate.map(renderChip)}
          </div>
        </div>
      )}
    </div>
  );
}
