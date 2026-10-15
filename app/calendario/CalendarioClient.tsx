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
  date: string; // formato "yyyy-mm-dd"
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const cells = getMonthGrid(year, month);

  function eventsOfDay(day: number) {
    return events.filter((e) => {
      const [eYear, eMonth, eDay] = e.date.split("-").map(Number);
      return eYear === year && eMonth - 1 === month && eDay === day;
    });
  }

  const selectedEvents = selectedDay !== null ? eventsOfDay(selectedDay) : [];

  function goPrev() {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function renderEvent(event: Event, full = false) {
    return (
      <Link
        key={event.id}
        href={`/clientes/${event.clientId}`}
        className="bg-card-alt border border-line rounded-badge px-2 py-1 hover:border-champagne transition-colors"
      >
        <p className={`text-[11px] text-text-secondary ${full ? "" : "truncate"}`}>
          {event.clientName}
        </p>
        <p className={`text-[11px] text-text ${full ? "break-words" : "truncate"}`}>
          {event.title}
        </p>
        <p className="text-[10px] text-champagne">{statusLabels[event.status]}</p>
      </Link>
    );
  }

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-medium">
          <CalendarDays size={22} className="text-champagne" strokeWidth={1.5} />
          Calendário
        </h2>
        <div className="flex items-center gap-2 md:gap-3">
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
              className="py-2 md:p-3 text-[10px] md:text-xs text-text-tertiary uppercase tracking-wide text-center"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day !== null ? eventsOfDay(day) : [];
            const isSelected = day !== null && day === selectedDay;
            return (
              <div
                key={i}
                onClick={() => day !== null && setSelectedDay(isSelected ? null : day)}
                className={`min-h-16 md:min-h-28 min-w-0 border-b border-line p-1 md:p-2 flex flex-col items-center md:items-stretch gap-1 ${
                  i % 7 !== 6 ? "border-r" : ""
                } ${day !== null ? "cursor-pointer md:cursor-default" : ""} ${
                  isSelected ? "bg-card-alt md:bg-transparent" : ""
                }`}
              >
                {day !== null && (
                  <>
                    <span className="text-xs text-text-tertiary">{day}</span>

                    {/* Celular: bolinhas */}
                    <div className="flex md:hidden flex-wrap justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className="w-1.5 h-1.5 rounded-full bg-champagne" />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] leading-none text-champagne">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Computador: cards */}
                    <div className="hidden md:flex flex-col gap-1">
                      {dayEvents.map((event) => renderEvent(event))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Celular: lista do dia */}
      {selectedDay !== null ? (
        <div className="md:hidden border border-line rounded-card bg-card p-4 flex flex-col gap-2">
          <p className="text-xs text-text-tertiary uppercase tracking-wide">
            Dia {selectedDay} de {monthNames[month]}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-text-tertiary">Nada agendado nesse dia.</p>
          ) : (
            selectedEvents.map((event) => renderEvent(event, true))
          )}
        </div>
      ) : (
        <p className="md:hidden text-xs text-text-tertiary text-center">
          Toque num dia pra ver os conteúdos.
        </p>
      )}
    </div>
  );
}
