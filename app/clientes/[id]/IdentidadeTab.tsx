"use client";

import { useState } from "react";
import { Type, MessageSquare, type LucideIcon } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { IdentidadeBriefing } from "./IdentidadeBriefing";

export type BrandRow = {
  colors: string[] | null;
  fonts: string | null;
  logo_url: string | null;
  tone_of_voice: string | null;
};

const inputCls =
  "bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary";

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
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

export function IdentidadeTab({
  clientId,
  initial,
}: {
  clientId: string;
  initial: BrandRow | null;
}) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [fonts, setFonts] = useState(initial?.fonts ?? "");
  const [tone, setTone] = useState(initial?.tone_of_voice ?? "");

  async function save(fields: Record<string, unknown>) {
    setStatus("saving");
    const { error } = await supabase
      .from("mt_client_brand")
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

  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 text-xs text-text-tertiary text-right">
        {status === "saving" && "salvando..."}
        {status === "saved" && "salvo"}
      </div>

      <IdentidadeBriefing clientId={clientId} initial={initial} />

      <Section
        icon={Type}
        title="Fontes"
        hint="Fontes da marca. Ex.: Títulos em Playfair Display, textos em Inter."
      >
        <textarea
          value={fonts}
          onChange={(e) => setFonts(e.target.value)}
          onBlur={() => {
            if (fonts !== (initial?.fonts ?? "")) save({ fonts: fonts || null });
          }}
          placeholder="Descreva as fontes..."
          className={`${inputCls} resize-none min-h-[90px]`}
        />
      </Section>

      <Section
        icon={MessageSquare}
        title="Tom de voz"
        hint="Como a marca fala: formal ou leve, palavras que usa, palavras que evita."
      >
        <textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          onBlur={() => {
            if (tone !== (initial?.tone_of_voice ?? "")) save({ tone_of_voice: tone || null });
          }}
          placeholder="Descreva o tom de voz..."
          className={`${inputCls} resize-none min-h-[140px]`}
        />
      </Section>
    </div>
  );
}