"use client";

import { useState } from "react";
import { Plus, X, User, Layers, Eye, Radio, Target, ExternalLink } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export type Pillar = { id: string; name: string; description: string };
export type Competitor = { id: string; name: string; handle: string; notes: string };
export type Goal = { id: string; metric: string; target: number | null; deadline: string };

export type StrategyRow = {
  persona: string | null;
  pillars: Pillar[] | null;
  competitors: Competitor[] | null;
  channels: string[] | null;
  goals: Goal[] | null;
};

const channelOptions = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Facebook",
  "Pinterest",
  "WhatsApp",
  "Blog",
];

const inputCls =
  "bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary";

function profileUrl(raw: string) {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.)?[a-z0-9-]+\.[a-z]{2,}\//i.test(v)) return "https://" + v;
  return `https://instagram.com/${encodeURIComponent(v.replace(/^@/, ""))}`;
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Target;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-line rounded-card bg-card p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
          <Icon size={14} className="text-champagne" strokeWidth={1.5} />
          {title}
        </h3>
        <p className="text-xs text-text-tertiary mt-1">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export function EstrategiaTab({
  clientId,
  initial,
}: {
  clientId: string;
  initial: StrategyRow | null;
}) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [persona, setPersona] = useState(initial?.persona ?? "");
  const [pillars, setPillars] = useState<Pillar[]>(initial?.pillars ?? []);
  const [competitors, setCompetitors] = useState<Competitor[]>(initial?.competitors ?? []);
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? []);
  const [goals, setGoals] = useState<Goal[]>(initial?.goals ?? []);

  async function save(fields: Record<string, unknown>) {
    setStatus("saving");
    const { error } = await supabase
      .from("mt_client_strategy")
      .upsert(
        { client_id: clientId, ...fields, updated_at: new Date().toISOString() },
        { onConflict: "client_id" }
      );
    if (error) {
      setStatus("idle");
      alert("Erro ao salvar: " + error.message);
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  // ---------- Pilares ----------
  function patchPillar(id: string, patch: Partial<Pillar>) {
    setPillars((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function addPillar() {
    setPillars((cur) => [...cur, { id: crypto.randomUUID(), name: "", description: "" }]);
  }
  function removePillar(id: string) {
    const next = pillars.filter((p) => p.id !== id);
    setPillars(next);
    save({ pillars: next });
  }

  // ---------- Concorrentes ----------
  function patchCompetitor(id: string, patch: Partial<Competitor>) {
    setCompetitors((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function addCompetitor() {
    setCompetitors((cur) => [
      ...cur,
      { id: crypto.randomUUID(), name: "", handle: "", notes: "" },
    ]);
  }
  function removeCompetitor(id: string) {
    const next = competitors.filter((c) => c.id !== id);
    setCompetitors(next);
    save({ competitors: next });
  }

  // ---------- Canais ----------
  function toggleChannel(ch: string) {
    const next = channels.includes(ch)
      ? channels.filter((c) => c !== ch)
      : [...channels, ch];
    setChannels(next);
    save({ channels: next });
  }

  // ---------- Metas ----------
  function patchGoal(id: string, patch: Partial<Goal>) {
    setGoals((cur) => cur.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }
  function addGoal() {
    setGoals((cur) => [
      ...cur,
      { id: crypto.randomUUID(), metric: "", target: null, deadline: "" },
    ]);
  }
  function removeGoal(id: string) {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    save({ goals: next });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 text-xs text-text-tertiary text-right">
        {status === "saving" && "salvando..."}
        {status === "saved" && "salvo"}
      </div>

      <Section
        icon={User}
        title="Persona"
        hint="Quem é o público ideal: idade, rotina, dores, o que busca."
      >
        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          onBlur={() => {
            if (persona !== (initial?.persona ?? "")) save({ persona: persona || null });
          }}
          placeholder="Descreva a persona do cliente..."
          className={`${inputCls} resize-none min-h-[140px]`}
        />
      </Section>

      <Section
        icon={Layers}
        title="Pilares de conteúdo"
        hint="Os grandes temas que sustentam o conteúdo."
      >
        {pillars.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 border-b border-line pb-3 last:border-0">
            <div className="flex items-center gap-2">
              <input
                value={p.name}
                onChange={(e) => patchPillar(p.id, { name: e.target.value })}
                onBlur={() => save({ pillars })}
                placeholder="Nome do pilar"
                className={`${inputCls} flex-1 min-w-0`}
              />
              <button
                onClick={() => removePillar(p.id)}
                className="text-text-tertiary hover:text-red-400 transition-colors"
                title="Remover"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
            <input
              value={p.description}
              onChange={(e) => patchPillar(p.id, { description: e.target.value })}
              onBlur={() => save({ pillars })}
              placeholder="Sobre o que fala (opcional)"
              className={inputCls}
            />
          </div>
        ))}
        <button
          onClick={addPillar}
          className="flex items-center gap-1.5 self-start text-xs text-text-secondary hover:text-champagne transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          Adicionar pilar
        </button>
      </Section>

      <Section
        icon={Eye}
        title="Concorrentes"
        hint="Perfis que disputam a atenção do mesmo público."
      >
        {competitors.map((c) => (
          <div key={c.id} className="flex flex-col gap-2 border-b border-line pb-3 last:border-0">
            <div className="flex items-center gap-2">
              <input
                value={c.name}
                onChange={(e) => patchCompetitor(c.id, { name: e.target.value })}
                onBlur={() => save({ competitors })}
                placeholder="Nome"
                className={`${inputCls} flex-1 min-w-0`}
              />
              <input
                value={c.handle}
                onChange={(e) => patchCompetitor(c.id, { handle: e.target.value })}
                onBlur={() => save({ competitors })}
                placeholder="@perfil ou link"
                className={`${inputCls} w-32 sm:w-48`}
              />
              {profileUrl(c.handle) && (
                <a
                  href={profileUrl(c.handle)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir perfil"
                  className="text-text-tertiary hover:text-champagne transition-colors"
                >
                  <ExternalLink size={15} strokeWidth={1.5} />
                </a>
              )}
              <button
                onClick={() => removeCompetitor(c.id)}
                className="text-text-tertiary hover:text-red-400 transition-colors"
                title="Remover"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
            <input
              value={c.notes}
              onChange={(e) => patchCompetitor(c.id, { notes: e.target.value })}
              onBlur={() => save({ competitors })}
              placeholder="O que fazem bem, onde falham (opcional)"
              className={inputCls}
            />
          </div>
        ))}
        <button
          onClick={addCompetitor}
          className="flex items-center gap-1.5 self-start text-xs text-text-secondary hover:text-champagne transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          Adicionar concorrente
        </button>
      </Section>

      <Section icon={Radio} title="Canais" hint="Onde o cliente vai estar presente.">
        <div className="flex flex-wrap gap-2">
          {channelOptions.map((ch) => {
            const active = channels.includes(ch);
            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`text-xs rounded-badge px-3 py-1.5 border transition-colors ${
                  active
                    ? "border-champagne text-champagne"
                    : "border-line text-text-secondary hover:border-line-strong"
                }`}
              >
                {ch}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        icon={Target}
        title="Metas"
        hint="Meta com número e prazo. Ex.: Seguidores, 5000, até 31/12."
      >
        {goals.map((g) => (
          <div
            key={g.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_9rem_auto] gap-2 items-center border-b border-line pb-3 last:border-0"
          >
            <input
              value={g.metric}
              onChange={(e) => patchGoal(g.id, { metric: e.target.value })}
              onBlur={() => save({ goals })}
              placeholder="Métrica (ex.: Seguidores)"
              className={inputCls}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={g.target ?? ""}
              onChange={(e) =>
                patchGoal(g.id, {
                  target: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              onBlur={() => save({ goals })}
              placeholder="Número"
              className={inputCls}
            />
            <input
              type="date"
              value={g.deadline}
              onChange={(e) => patchGoal(g.id, { deadline: e.target.value })}
              onBlur={() => save({ goals })}
              className={`${inputCls} cursor-pointer [color-scheme:dark]`}
            />
            <button
              onClick={() => removeGoal(g.id)}
              className="text-text-tertiary hover:text-red-400 transition-colors justify-self-end"
              title="Remover"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          onClick={addGoal}
          className="flex items-center gap-1.5 self-start text-xs text-text-secondary hover:text-champagne transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          Adicionar meta
        </button>
      </Section>
    </div>
  );
}