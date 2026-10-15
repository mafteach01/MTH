"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

type ContentStatus = "ideia" | "roteiro" | "producao" | "aprovacao" | "publicado";

const statusLabels: Record<ContentStatus, string> = {
  ideia: "Ideias",
  roteiro: "Roteiro",
  producao: "Produção",
  aprovacao: "Aprovação",
  publicado: "Publicado",
};

type Event = {
  id: string;
  title: string;
  status: ContentStatus;
    date: string; // formato "dd/mm"
  clientId: string;
  clientName: string;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarioClient({ events }: { events: Event[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const cells = getMonthGrid(year, month);

  function goPrev() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="p-10 flex flex-col gap-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-3xl font-medium">
          <CalendarDays size={22} className="text-champagne" strokeWidth={1.5} />
          Calendário
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="w-8 h-8 flex items-center justify-center rounded-card border border-line hover:border-line-strong transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <p className="text-sm text-text-secondary w-32 text-center">
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

      <div className="border border-line rounded-card bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-xs text-text-tertiary uppercase tracking-wide text-center"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
                        const dayEvents =
              day !== null
                ? events.filter((e) => {
                    const [eDay, eMonth] = e.date.split("/").map(Number);
                    return eMonth - 1 === month && eDay === day;
                  })
                : [];
            return (
              <div
                key={i}
                className="min-h-28 border-b border-r border-line p-2 flex flex-col gap-1 last:border-r-0"
              >
                {day !== null && (
                  <>
                    <span className="text-xs text-text-tertiary">{day}</span>
                    <div className="flex flex-col gap-1">
                      {dayEvents.map((event) => (
                        <Link
                          key={event.id}
                          href={`/clientes/${event.clientId}`}
                          className="bg-card-alt border border-line rounded-badge px-2 py-1 hover:border-champagne transition-colors"
                        >
                          <p className="text-[11px] text-text-secondary truncate">
                            {event.clientName}
                          </p>
                          <p className="text-[11px] text-text truncate">{event.title}</p>
                          <p className="text-[10px] text-champagne">
                            {statusLabels[event.status]}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}