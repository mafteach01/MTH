"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ChevronDown,
  Plus,
  X,
  Briefcase,
  Target,
  Users,
  Gem,
  Camera,
  Crosshair,
  Smartphone,
  ClipboardList,
  CheckCheck,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import type { BrandRow } from "./IdentidadeTab";

type Field = { key: string; label: string; hint?: string };
type Block = {
  id: string;
  title: string;
  icon: typeof Briefcase;
  fields: Field[];
};

const blocks: Block[] = [
  {
    id: "negocio",
    title: "1. O negócio",
    icon: Briefcase,
    fields: [
      { key: "nome_ramo", label: "Nome, ramo e tempo de mercado" },
      { key: "produtos", label: "O que vende e qual o carro-chefe" },
      { key: "ticket", label: "Ticket médio e margem dos principais produtos", hint: "Ajuda a definir o que vale mais empurrar" },
      { key: "localizacao", label: "Localização", hint: "Físico, online ou os dois? Região de atuação" },
      { key: "diferenciais", label: "Diferenciais", hint: "Por que compram dele e não do concorrente?" },
    ],
  },
  {
    id: "objetivo",
    title: "2. Objetivo com as redes",
    icon: Target,
    fields: [
      { key: "o_que_quer", label: "O que ele quer", hint: "Vender, gerar leads/agendamentos, autoridade, marca" },
      { key: "meta", label: "Meta concreta", hint: "Ex.: 30 agendamentos por mês, 5 mil seguidores" },
      { key: "ja_tentou", label: "O que já tentou e o que funcionou ou não" },
    ],
  },
  {
    id: "publico",
    title: "3. Público-alvo",
    icon: Users,
    fields: [
      { key: "quem_compra", label: "Quem compra", hint: "Idade, gênero, renda, cidade, estilo de vida" },
      { key: "dores", label: "Dores, desejos e objeções antes de comprar" },
      { key: "onde_esta", label: "Onde esse público está", hint: "Instagram, TikTok, WhatsApp, Google" },
      { key: "como_fala", label: "Como ele fala", hint: "Linguagem, gírias, formalidade" },
    ],
  },
  {
    id: "posicionamento",
    title: "4. Posicionamento da marca",
    icon: Gem,
    fields: [
      { key: "percebido", label: "Como quer ser percebido", hint: "Popular, premium, acessível, divertido, sofisticado" },
      { key: "valores", label: "Valores e personalidade", hint: "Se a marca fosse uma pessoa, como seria?" },
      { key: "tom", label: "Tom de voz", hint: "Formal, descontraído, técnico, acolhedor" },
      { key: "slogan", label: "Slogan ou frase que usa", hint: "Se não tem, o que gostaria de transmitir" },
      { key: "palavras", label: "Palavras e temas que quer e que não quer" },
    ],
  },
  {
    id: "visual",
    title: "5. Identidade visual",
    icon: Camera,
    fields: [
      { key: "arquivos", label: "Arquivos originais e fontes", hint: "Logo em vetor e PNG, fontes usadas. Já tem? Onde estão?" },
      { key: "ref_visuais", label: "Referências que gosta e não gosta", hint: "Perfis, marcas, estilos" },
      { key: "cores_rejeita", label: "Cores que combinam com o negócio ou que rejeita", hint: "Escreva em texto. A paleta com seletor fica logo abaixo" },
      { key: "material", label: "Fotos e vídeos", hint: "Tem material próprio? Fachada, produtos, equipe? Quem produz?" },
      { key: "manual", label: "Manual de marca e aplicações existentes", hint: "Fachada, embalagem, uniforme" },
    ],
  },
  {
    id: "concorrencia",
    title: "6. Concorrência e referências",
    icon: Crosshair,
    fields: [
      { key: "concorrentes", label: "3 a 5 concorrentes diretos", hint: "E o que ele acha deles" },
      { key: "admira", label: "3 a 5 perfis que ele admira", hint: "Pode ser de outros segmentos" },
      { key: "falta", label: "O que sente que falta no mercado dele" },
    ],
  },
  {
    id: "estado",
    title: "7. Estado atual das redes",
    icon: Smartphone,
    fields: [
      { key: "perfis", label: "Perfis existentes e quem administra hoje", hint: "Só links. NÃO coloque senha aqui" },
      { key: "posta", label: "O que posta, frequência e o que tem mais resultado" },
      { key: "metricas", label: "Métricas atuais", hint: "Seguidores, alcance, engajamento, cliques no link" },
      { key: "outras", label: "Outras plataformas", hint: "Google Meu Negócio, WhatsApp Business, site" },
    ],
  },
  {
    id: "operacao",
    title: "8. Operação e logística",
    icon: ClipboardList,
    fields: [
      { key: "aprova", label: "Quem aprova os conteúdos e em quanto tempo" },
      { key: "fornece", label: "Quem fornece material e com que frequência", hint: "Fotos, vídeos, depoimentos, promoções" },
      { key: "datas", label: "Datas importantes e sazonalidade", hint: "Lançamentos e promoções do ano" },
      { key: "restricoes", label: "Restrições", hint: "O que não pode ser dito ou mostrado" },
      { key: "orcamento", label: "Orçamento para tráfego pago" },
      { key: "canal", label: "Canal de comunicação e prazo de resposta combinados" },
    ],
  },
  {
    id: "fechar",
    title: "9. Para fechar",
    icon: CheckCheck,
    fields: [
      { key: "medir", label: "Como vai medir se deu certo e em quanto tempo" },
      { key: "entrega", label: "O que você entrega e o que fica por conta dele" },
    ],
  },
];

const inputCls =
  "bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary";
const areaCls = `${inputCls} resize-none min-h-[64px] w-full`;
const hexRegex = /^#[0-9a-fA-F]{6}$/;

export function IdentidadeBriefing({
  clientId,
  initial,
}: {
  clientId: string;
  initial: BrandRow | null;
}) {
  const [supabase] = useState(() => createClient());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<string | null>("negocio");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});

  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [logoSaved, setLogoSaved] = useState(initial?.logo_url ?? "");

  useEffect(() => {
    supabase
      .from("mt_client_briefing")
      .select("answers")
      .eq("client_id", clientId)
      .maybeSingle()
      .then(({ data }) => {
        const a = (data?.answers ?? {}) as Record<string, string>;
        setAnswers(a);
        setLastSaved(a);
        setLoaded(true);
      });
  }, [supabase, clientId]);

  function done() {
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  async function save(key: string) {
    if ((answers[key] ?? "") === (lastSaved[key] ?? "")) return;
    setStatus("saving");
    const { error } = await supabase
      .from("mt_client_briefing")
      .upsert(
        { client_id: clientId, answers, updated_at: new Date().toISOString() },
        { onConflict: "client_id" }
      );
    if (error) {
      setStatus("idle");
      alert("Erro ao salvar: " + error.message);
      return;
    }
    setLastSaved(answers);
    done();
  }

  async function saveBrand(fields: Record<string, unknown>) {
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
      return false;
    }
    done();
    return true;
  }

  function addColor() {
    const next = [...colors, "#D8C5A5"];
    setColors(next);
    saveBrand({ colors: next });
  }

  function patchColor(index: number, value: string) {
    setColors((cur) => cur.map((c, i) => (i === index ? value : c)));
  }

  function commitColors() {
    const clean = colors.map((c) => (hexRegex.test(c) ? c.toUpperCase() : "#D8C5A5"));
    setColors(clean);
    saveBrand({ colors: clean });
  }

  function removeColor(index: number) {
    const next = colors.filter((_, i) => i !== index);
    setColors(next);
    saveBrand({ colors: next });
  }

  async function commitLogo() {
    const clean = logoUrl.trim();
    if (clean === logoSaved) return;
    const ok = await saveBrand({ logo_url: clean || null });
    if (ok) setLogoSaved(clean);
  }

  if (!loaded) return null;

  const logoBlock = (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-text-secondary">Link do logo</label>
      <p className="text-xs text-text-tertiary -mt-1">
        Cole o link direto da imagem (Drive, site, etc.)
      </p>
      <input
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        onBlur={commitLogo}
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
    </div>
  );

  const paletteBlock = (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-text-secondary">Paleta de cores</label>
      <p className="text-xs text-text-tertiary -mt-1">
        Toque no quadrado pra escolher ou digite o código.
      </p>
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
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="h-4 text-xs text-text-tertiary text-right">
        {status === "saving" && "salvando..."}
        {status === "saved" && "salvo"}
      </div>

      {blocks.map((b) => {
        const Icon = b.icon;
        const isOpen = open === b.id;
        const filled = b.fields.filter((f) => (answers[f.key] ?? "").trim()).length;
        return (
          <div key={b.id} className="border border-line rounded-card bg-card min-w-0">
            <button
              onClick={() => setOpen(isOpen ? null : b.id)}
              className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left"
            >
              <span className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide min-w-0">
                <Icon size={14} className="text-champagne shrink-0" strokeWidth={1.5} />
                <span className="break-words">{b.title}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0 text-xs text-text-tertiary">
                {filled}/{b.fields.length}
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {isOpen && (
              <div className="px-4 md:px-5 pb-4 md:pb-5 flex flex-col gap-4">
                {b.fields.map((f) => (
                  <Fragment key={f.key}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-text-secondary">{f.label}</label>
                      {f.hint && <p className="text-xs text-text-tertiary -mt-1">{f.hint}</p>}
                      <textarea
                        value={answers[f.key] ?? ""}
                        onChange={(e) => setAnswers((cur) => ({ ...cur, [f.key]: e.target.value }))}
                        onBlur={() => save(f.key)}
                        className={areaCls}
                      />
                    </div>
                    {f.key === "arquivos" && logoBlock}
                    {f.key === "cores_rejeita" && paletteBlock}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}