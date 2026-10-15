"use client";

import { useState } from "react";
import { Plus, X, Palette, Type, Image as ImageIcon, MessageSquare } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export type BrandRow = {
  colors: string[] | null;
  fonts: string | null;
  logo_url: string | null;
  tone_of_voice: string | null;
};

const inputCls =
  "bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary";

const hexRegex = /^#[0-9a-fA-F]{6}$/;

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Palette;
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

  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [fonts, setFonts] = useState(initial?.fonts ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
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

  function addColor() {
    const next = [...colors, "#D8C5A5"];
    setColors(next);
    save({ colors: next });
  }

  function patchColor(index: number, value: string) {
    setColors((cur) => cur.map((c, i) => (i === index ? value : c)));
  }

  function commitColors() {
    const clean = colors.map((c) => (hexRegex.test(c) ? c.toUpperCase() : "#D8C5A5"));
    setColors(clean);
    save({ colors: clean });
  }

  function removeColor(index: number) {
    const next = colors.filter((_, i) => i !== index);
    setColors(next);
    save({ colors: next });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 text-xs text-text-tertiary text-right">
        {status === "saving" && "salvando..."}
        {status === "saved" && "salvo"}
      </div>

      <Section
        icon={Palette}
        title="Cores"
        hint="Paleta da marca. Toque no quadrado pra escolher ou digite o código."
      >
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={hexRegex.test(c) ? c : "#D8C5A5"}
              onChange={(e) => patchColor(i, e.target.value)}
              onBlur={commitColors}
              className="w-10 h-10 rounded-card bg-transparent border border-line cursor-pointer shrink-0"
            />
            <input
              value={c}
              onChange={(e) => patchColor(i, e.target.value)}
              onBlur={commitColors}
              placeholder="#D8C5A5"
              className={`${inputCls} flex-1 min-w-0`}
            />
            <button
              onClick={() => removeColor(i)}
              className="text-text-tertiary hover:text-red-400 transition-colors"
              title="Remover"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <button
          onClick={addColor}
          className="flex items-center gap-1.5 self-start text-xs text-text-secondary hover:text-champagne transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          Adicionar cor
        </button>
      </Section>

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
        icon={ImageIcon}
        title="Logo"
        hint="Cole o link do logo (Drive, site, etc.). Tem que ser link direto da imagem."
      >
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          onBlur={() => {
            if (logoUrl !== (initial?.logo_url ?? "")) save({ logo_url: logoUrl.trim() || null });
          }}
          placeholder="https://..."
          className={inputCls}
        />
        {logoUrl.trim() && (
          <div className="border border-line rounded-card bg-card-alt p-4 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl.trim()}
              alt="Logo"
              className="max-h-32 max-w-full object-contain"
            />
          </div>
        )}
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