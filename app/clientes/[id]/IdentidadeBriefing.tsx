"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
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
      { key: "slogan", label: "Slogan ou frase que usa", hint: "Se não tem, o que gostaria de transmitir" },
      { key: "palavras", label: "Palavras e temas que quer e que não quer", hint: "O tom de voz fica mais abaixo" },
    ],
  },
  {
    id: "visual",
    title: "5. Identidade visual",
    icon: Camera,
    fields: [
      { key: "arquivos", label: "Arquivos originais", hint: "Logo em vetor e PNG. Já tem? Onde estão?" },
      { key: "ref_visuais", label: "Referências que gosta e não gosta", hint: "Perfis, marcas, estilos" },
      { key: "cores_rejeita", label: "Cores que combinam com o negócio ou que rejeita", hint: "A paleta e as fontes ficam mais abaixo" },
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
  "bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary resize-none min-h-[64px] w-full";

export function IdentidadeBriefing({ clientId }: { clientId: string }) {
  const [supabase] = useState(() => createClient());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<string | null>("negocio");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});

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
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  if (!loaded) return null;

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
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary">{f.label}</label>
                    {f.hint && <p className="text-xs text-text-tertiary -mt-1">{f.hint}</p>}
                    <textarea
                      value={answers[f.key] ?? ""}
                      onChange={(e) => setAnswers((cur) => ({ ...cur, [f.key]: e.target.value }))}
                      onBlur={() => save(f.key)}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}