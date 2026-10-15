"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  NotebookText,
  ListChecks,
  BarChart3,
  Lightbulb,
  ScrollText,
  Clapperboard,
  CheckCircle2,
  Send,
  Trash2,
  Pencil,
  IdCard,
  Briefcase,
  Lock as LockIcon,
  UserCheck,
  AtSign,
  Shield,
  LayoutGrid,
  ClipboardList,
  CalendarDays,
  Link2,
  Check,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { ContentTable } from "./ContentTable";
import { ContentDetailPanel } from "./ContentDetailPanel";
import { CalendarioEditorial } from "./CalendarioEditorial";

export type ContentStatus = "ideia" | "roteiro" | "producao" | "aprovacao" | "publicado";
export type Funil = "Topo" | "Meio" | "Final" | null;
export type TipoConteudo = "Reels" | "Card" | "Carrossel" | "Story" | null;

export type ChecklistEntry = { id: string; text: string; done: boolean };
export type ContentItem = {
  id: string;
  title: string;
  status: ContentStatus;
  date: string | null;
  funil: Funil;
  tipo_conteudo: TipoConteudo;
  roteiro: string | null;
  scheduled_date: string | null;
  legenda?: string | null;
  audio?: string | null;
  checklist?: ChecklistEntry[] | null;
  published_url?: string | null;
  scheduled_time?: string | null;
  published_at?: string | null;
  approval_status?: "aprovado" | "ajuste" | null;
};

type Note = {
  id: string;
  text: string;
  created_at: string;
};

type TeamMember = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
};

type RosterEntry = {
  id: string;
  team_id: string;
  team_member_id: string;
  role: string;
};

type Client = {
  id: string;
  name: string;
  objective: string | null;
  plan: string | null;
  status: string;
  last_content: string | null;
  person_type: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  contract_value: string | null;
  due_day: number | null;
  contract_start: string | null;
  contract_status: string | null;
  management_level: string | null;
  instagram_handle: string | null;
  responsible_id: string | null;
  team_id: string | null;
  approval_token: string;
};

const statusOrder: ContentStatus[] = ["ideia", "roteiro", "producao", "aprovacao", "publicado"];
const clientStatusOptions = ["Ativo", "Em planejamento", "Em produção"];
const contractStatusOptions = ["Ativo", "Pausado", "Encerrado"];
const managementLevelOptions: { value: string; label: string }[] = [
  { value: "total", label: "Administração total" },
  { value: "aprovacao", label: "Aprovação e envio" },
  { value: "parcial", label: "Acesso parcial" },
];

export const statusLabels: Record<ContentStatus, string> = {
  ideia: "Ideias",
  roteiro: "Roteiro",
  producao: "Produção",
  aprovacao: "Aprovação",
  publicado: "Publicado",
};

const statusIcons: Record<ContentStatus, typeof Lightbulb> = {
  ideia: Lightbulb,
  roteiro: ScrollText,
  producao: Clapperboard,
  aprovacao: CheckCircle2,
  publicado: Send,
};

const managementLevelLabels: Record<string, string> = {
  total: "Administração total",
  aprovacao: "Aprovação e envio",
  parcial: "Acesso parcial",
};

function todayDDMM() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ddmmFromISO(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const planLabelRegex = /^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo|Total):/;

function splitPlan(plan: string | null) {
  if (!plan) return [];
  return plan
    .split(/\s*(?=(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo|Total):)/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type Tab = "geral" | "planejamento" | "calendario";

export function ClientDetail({
  client: initialClient,
  initialItems,
  notes: initialNotes,
  team,
  teams,
  roster,
}: {
  client: Client;
  initialItems: ContentItem[];
  notes: Note[];
  team: TeamMember[];
  teams: Team[];
  roster: RosterEntry[];
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [activeTab, setActiveTab] = useState<Tab>("geral");

  const [client, setClient] = useState<Client>(initialClient);
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function copyApprovalLink() {
    const url = `${window.location.origin}/aprovar/${client.approval_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert("Não consegui copiar. Link: " + url);
    }
  }

  // Painel de detalhe de um item de conteúdo (abre pelo ícone de expandir na tabela)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const expandedItem = items.find((i) => i.id === expandedItemId) ?? null;

  // Edição de objetivo / plano
  const [editingObjective, setEditingObjective] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [objectiveDraft, setObjectiveDraft] = useState(client.objective ?? "");
  const [planDraft, setPlanDraft] = useState(client.plan ?? "");

  // Edição dos dados do cliente
  const [editingInfo, setEditingInfo] = useState(false);
  const [documentDraft, setDocumentDraft] = useState(client.document ?? "");
  const [emailDraft, setEmailDraft] = useState(client.email ?? "");
  const [phoneDraft, setPhoneDraft] = useState(client.phone ?? "");
  const [contractValueDraft, setContractValueDraft] = useState(client.contract_value ?? "");
  const [dueDayDraft, setDueDayDraft] = useState(client.due_day ? String(client.due_day) : "");
  const [contractStartDraft, setContractStartDraft] = useState(client.contract_start ?? "");
  const [contractStatusDraft, setContractStatusDraft] = useState(client.contract_status ?? "Ativo");
  const [managementLevelDraft, setManagementLevelDraft] = useState(client.management_level ?? "total");
  const [instagramHandleDraft, setInstagramHandleDraft] = useState(client.instagram_handle ?? "");
  const [responsibleIdDraft, setResponsibleIdDraft] = useState(client.responsible_id ?? "");
  const [teamIdDraft, setTeamIdDraft] = useState(client.team_id ?? "");

  // Nova nota
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const total = items.length || 1;
  const responsibleName = team.find((m) => m.id === client.responsible_id)?.name ?? null;
  const clientTeam = teams.find((t) => t.id === client.team_id) ?? null;
  const clientTeamRoster = roster.filter((r) => r.team_id === client.team_id);

  // ---------- Objetivo / Plano ----------
  async function saveObjective() {
    setSaving(true);
    const { error } = await supabase
      .from("mt_clients")
      .update({ objective: objectiveDraft })
      .eq("id", client.id);
    setSaving(false);
    if (error) {
      alert("Erro ao salvar objetivo: " + error.message);
      return;
    }
    setClient((c) => ({ ...c, objective: objectiveDraft }));
    setEditingObjective(false);
  }

  async function savePlan() {
    setSaving(true);
    const { error } = await supabase
      .from("mt_clients")
      .update({ plan: planDraft })
      .eq("id", client.id);
    setSaving(false);
    if (error) {
      alert("Erro ao salvar plano: " + error.message);
      return;
    }
    setClient((c) => ({ ...c, plan: planDraft }));
    setEditingPlan(false);
  }

  async function changeClientStatus(newStatus: string) {
    const previous = client.status;
    setClient((c) => ({ ...c, status: newStatus }));
    const { error } = await supabase
      .from("mt_clients")
      .update({ status: newStatus })
      .eq("id", client.id);
    if (error) {
      setClient((c) => ({ ...c, status: previous }));
      alert("Erro ao atualizar status: " + error.message);
    }
  }

  async function deleteClient() {
    if (
      !confirm(
        `Apagar "${client.name}" de vez? Isso apaga o cliente, os conteúdos e as notas dele. Não tem como desfazer.`
      )
    )
      return;

    setSaving(true);
    const { error } = await supabase.from("mt_clients").delete().eq("id", client.id);
    setSaving(false);

    if (error) {
      alert("Erro ao apagar cliente: " + error.message);
      return;
    }
    router.push("/clientes");
  }

  // ---------- Dados do cliente ----------
  function openEditInfo() {
    setDocumentDraft(client.document ?? "");
    setEmailDraft(client.email ?? "");
    setPhoneDraft(client.phone ?? "");
    setContractValueDraft(client.contract_value ?? "");
    setDueDayDraft(client.due_day ? String(client.due_day) : "");
    setContractStartDraft(client.contract_start ?? "");
    setContractStatusDraft(client.contract_status ?? "Ativo");
    setManagementLevelDraft(client.management_level ?? "total");
    setInstagramHandleDraft(client.instagram_handle ?? "");
    setResponsibleIdDraft(client.responsible_id ?? "");
    setTeamIdDraft(client.team_id ?? "");
    setEditingInfo(true);
  }

  async function saveInfo() {
    setSaving(true);

    const updates = {
      document: documentDraft || null,
      email: emailDraft || null,
      phone: phoneDraft || null,
      contract_value: contractValueDraft || null,
      due_day: dueDayDraft ? Number(dueDayDraft) : null,
      contract_start: contractStartDraft || null,
      contract_status: contractStatusDraft,
      management_level: managementLevelDraft,
      instagram_handle: instagramHandleDraft || null,
      responsible_id: responsibleIdDraft || null,
      team_id: teamIdDraft || null,
    };

    const { error } = await supabase.from("mt_clients").update(updates).eq("id", client.id);

    setSaving(false);
    if (error) {
      alert("Erro ao salvar dados: " + error.message);
      return;
    }
    setClient((c) => ({ ...c, ...updates }));
    setEditingInfo(false);
  }

  // ---------- Itens de conteúdo ----------
  async function createItem(isoDate?: string) {
    const iso = isoDate ?? todayISO();

    setSaving(true);
    const { data, error } = await supabase
      .from("mt_content_items")
      .insert({
        client_id: client.id,
        title: "Novo conteúdo",
        date: ddmmFromISO(iso),
        scheduled_date: iso,
        status: "ideia",
        funil: null,
        tipo_conteudo: null,
        roteiro: null,
      })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      alert("Erro ao criar: " + (error?.message ?? "desconhecido"));
      return;
    }

    const newItem: ContentItem = {
      id: data.id,
      title: data.title,
      status: data.status,
      date: data.date,
      funil: data.funil,
      tipo_conteudo: data.tipo_conteudo,
      roteiro: data.roteiro,
      scheduled_date: data.scheduled_date,
      legenda: data.legenda ?? null,
      audio: data.audio ?? null,
      checklist: data.checklist ?? [],
      published_url: data.published_url ?? null,
      scheduled_time: data.scheduled_time ?? null,
      published_at: data.published_at ?? null,
    };
    setItems((current) => [...current, newItem]);
    setExpandedItemId(newItem.id);
  }

  function moveItemDate(id: string, iso: string) {
    updateItemField(id, "scheduled_date", iso);
  }

  async function updateItemField<K extends keyof ContentItem>(
    id: string,
    field: K,
    value: ContentItem[K]
  ) {
    const previous = items.find((i) => i.id === id);
    if (!previous) return;

    setItems((current) => current.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

    const { error } = await supabase
      .from("mt_content_items")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      setItems((current) => current.map((i) => (i.id === id ? previous : i)));
      alert("Erro ao salvar: " + error.message);
    }
  }

  async function deleteContentItem(id: string) {
    if (!confirm("Apagar esse conteúdo? Essa ação não pode ser desfeita.")) return;

    setSaving(true);
    const { error } = await supabase.from("mt_content_items").delete().eq("id", id);
    setSaving(false);

    if (error) {
      alert("Erro ao apagar: " + error.message);
      return;
    }
    setItems((current) => current.filter((i) => i.id !== id));
    if (expandedItemId === id) setExpandedItemId(null);
  }

  // ---------- Notas ----------
  async function addNote() {
    if (!noteDraft.trim()) return;

    setSavingNote(true);
    const { data, error } = await supabase
      .from("mt_client_notes")
      .insert({ client_id: client.id, text: noteDraft, date: todayDDMM() })
      .select()
      .single();
    setSavingNote(false);

    if (error || !data) {
      alert("Erro ao salvar nota: " + (error?.message ?? "desconhecido"));
      return;
    }
    setNotes((current) => [
      { id: data.id, text: data.text, created_at: data.created_at },
      ...current,
    ]);
    setNoteDraft("");
  }

  async function deleteNote(id: string) {
    if (!confirm("Apagar essa nota?")) return;
    const { error } = await supabase.from("mt_client_notes").delete().eq("id", id);
    if (error) {
      alert("Erro ao apagar nota: " + error.message);
      return;
    }
    setNotes((current) => current.filter((n) => n.id !== id));
  }

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 max-w-6xl">
      <Link
        href="/clientes"
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-champagne w-fit"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Clientes
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="w-12 h-12 rounded-full bg-card-alt border border-line flex items-center justify-center text-champagne shrink-0">
          {client.name.charAt(0)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h2 className="text-2xl md:text-3xl font-medium">{client.name}</h2>
            <select
              value={client.status}
              onChange={(e) => changeClientStatus(e.target.value)}
              className="bg-card-alt border border-line rounded-badge text-xs px-2 py-1 outline-none cursor-pointer hover:border-champagne transition-colors"
            >
              {clientStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {saving && <span className="text-xs text-text-tertiary">salvando...</span>}
          </div>
          <p className="text-text-secondary text-sm mt-1">Último conteúdo: {client.last_content}</p>
        </div>
        <button
          onClick={copyApprovalLink}
          className="ml-auto flex items-center gap-1.5 text-xs text-text-tertiary hover:text-champagne transition-colors"
        >
          {linkCopied ? (
            <Check size={13} strokeWidth={1.5} />
          ) : (
            <Link2 size={13} strokeWidth={1.5} />
          )}
          {linkCopied ? "Link copiado" : "Link de aprovação"}
        </button>
        <button
          onClick={deleteClient}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} strokeWidth={1.5} />
          Apagar cliente
        </button>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 border-b border-line">
        <button
          onClick={() => setActiveTab("geral")}
          className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-2 md:px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "geral"
              ? "border-champagne text-text"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          <LayoutGrid size={14} strokeWidth={1.5} />
          Visão geral
        </button>
        <button
          onClick={() => setActiveTab("planejamento")}
          className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-2 md:px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "planejamento"
              ? "border-champagne text-text"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          <ClipboardList size={14} strokeWidth={1.5} />
          Planejamento
        </button>
        <button
          onClick={() => setActiveTab("calendario")}
          className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-2 md:px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "calendario"
              ? "border-champagne text-text"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          <CalendarDays size={14} strokeWidth={1.5} />
          <span className="md:hidden">Calendário</span>
          <span className="hidden md:inline">Calendário editorial</span>
        </button>
      </div>

      {activeTab === "geral" && (
        <div className="flex flex-col gap-6">
          {/* Dados do cliente */}
          <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
                <IdCard size={14} className="text-champagne" strokeWidth={1.5} />
                Dados do cliente
              </h3>
              {!editingInfo && (
                <button
                  onClick={openEditInfo}
                  className="text-text-tertiary hover:text-champagne transition-colors"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {editingInfo ? (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary">Documento (CPF/CNPJ)</label>
                    <input
                      value={documentDraft}
                      onChange={(e) => setDocumentDraft(e.target.value)}
                      className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary">E-mail</label>
                    <input
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary">WhatsApp</label>
                    <input
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-secondary">Responsável interno</label>
                    <select
                      value={responsibleIdDraft}
                      onChange={(e) => setResponsibleIdDraft(e.target.value)}
                      className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
                    >
                      <option value="">—</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs text-text-secondary">Equipe vinculada</label>
                    <select
                      value={teamIdDraft}
                      onChange={(e) => setTeamIdDraft(e.target.value)}
                      className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
                    >
                      <option value="">Nenhuma equipe</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-line pt-5">
                  <h4 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide mb-3">
                    <Briefcase size={13} className="text-champagne" strokeWidth={1.5} />
                    Comercial
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-text-secondary">Valor do contrato</label>
                      <input
                        value={contractValueDraft}
                        onChange={(e) => setContractValueDraft(e.target.value)}
                        placeholder="R$ 0,00 / mês"
                        className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-text-secondary">Dia de vencimento</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={dueDayDraft}
                        onChange={(e) => setDueDayDraft(e.target.value)}
                        className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-text-secondary">Início do contrato</label>
                      <input
                        type="date"
                        value={contractStartDraft}
                        onChange={(e) => setContractStartDraft(e.target.value)}
                        className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-text-secondary">Status do contrato</label>
                      <select
                        value={contractStatusDraft}
                        onChange={(e) => setContractStatusDraft(e.target.value)}
                        className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
                      >
                        {contractStatusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-line pt-5">
                  <h4 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide mb-3">
                    <LockIcon size={13} className="text-champagne" strokeWidth={1.5} />
                    Gestão da conta
                  </h4>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-text-secondary">Nível de gestão</label>
                        <select
                          value={managementLevelDraft}
                          onChange={(e) => setManagementLevelDraft(e.target.value)}
                          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors cursor-pointer"
                        >
                          {managementLevelOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-text-secondary">@ do Instagram</label>
                        <input
                          value={instagramHandleDraft}
                          onChange={(e) => setInstagramHandleDraft(e.target.value)}
                          placeholder="@usuario"
                          className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingInfo(false)}
                    className="text-xs text-text-tertiary hover:text-text px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveInfo}
                    className="text-xs bg-champagne text-black rounded-card px-3 py-1.5 hover:opacity-90"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Documento</p>
                    <p>{client.document || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">E-mail</p>
                    <p>{client.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">WhatsApp</p>
                    <p>{client.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5 flex items-center gap-1">
                      <UserCheck size={11} strokeWidth={1.5} />
                      Responsável
                    </p>
                    <p>{responsibleName || "—"}</p>
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <p className="text-xs text-text-tertiary mb-0.5 flex items-center gap-1">
                    <Shield size={11} strokeWidth={1.5} />
                    Equipe
                  </p>
                  <p className="text-sm mb-2">{clientTeam?.name || "—"}</p>
                  {clientTeam && (
                    <div className="flex flex-wrap gap-2">
                      {clientTeamRoster.map((entry) => {
                        const member = team.find((m) => m.id === entry.team_member_id);
                        return (
                          <span
                            key={entry.id}
                            className="text-xs bg-card-alt border border-line rounded-badge px-2 py-1"
                          >
                            {member?.name ?? "—"}{" "}
                            <span className="text-champagne">· {entry.role}</span>
                          </span>
                        );
                      })}
                      {clientTeamRoster.length === 0 && (
                        <p className="text-xs text-text-tertiary italic">Equipe sem membros ainda.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-line pt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Valor do contrato</p>
                    <p>{client.contract_value || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Vencimento</p>
                    <p>{client.due_day ? `Dia ${client.due_day}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Início do contrato</p>
                    <p>{client.contract_start || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Status do contrato</p>
                    <p>{client.contract_status || "—"}</p>
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-text-tertiary mb-0.5">Nível de gestão</p>
                      <p>
                        {client.management_level
                          ? managementLevelLabels[client.management_level]
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-0.5 flex items-center gap-1">
                        <AtSign size={11} strokeWidth={1.5} />
                        Instagram
                      </p>
                      <p>{client.instagram_handle || "—"}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Objetivo */}
          <div className="border border-line rounded-card bg-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
                <Target size={14} className="text-champagne" strokeWidth={1.5} />
                Objetivo
              </h3>
              {!editingObjective && (
                <button
                  onClick={() => {
                    setObjectiveDraft(client.objective ?? "");
                    setEditingObjective(true);
                  }}
                  className="text-text-tertiary hover:text-champagne transition-colors"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
              )}
            </div>
            {editingObjective ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={objectiveDraft}
                  onChange={(e) => setObjectiveDraft(e.target.value)}
                  rows={2}
                  className="bg-card-alt border border-line rounded-card p-3 text-sm outline-none focus:border-champagne transition-colors resize-none w-full"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingObjective(false)}
                    className="text-xs text-text-tertiary hover:text-text px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveObjective}
                    className="text-xs bg-champagne text-black rounded-card px-3 py-1.5 hover:opacity-90"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-champagne leading-relaxed">{client.objective || "—"}</p>
            )}
          </div>

          {/* Notas */}
          <div className="border border-line rounded-card bg-card p-6">
            <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide mb-3">
              <NotebookText size={14} className="text-champagne" strokeWidth={1.5} />
              Notas da equipe
            </h3>

            <div className="flex gap-2 mb-4">
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNote();
                }}
                placeholder="Escreva uma nota e aperte Enter..."
                className="flex-1 bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
              />
              <button
                onClick={addNote}
                disabled={savingNote || !noteDraft.trim()}
                className="text-xs bg-champagne text-black rounded-card px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Adicionar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {notes.length === 0 && (
                <p className="text-text-tertiary text-sm">Nenhuma nota ainda.</p>
              )}
              {notes.map((note) => (
                <div key={note.id} className="flex items-start justify-between gap-3 group">
                  <p className="text-sm">
                    <span className="text-champagne-dim">
                      {new Date(note.created_at).toLocaleDateString("pt-BR")}
                    </span>{" "}
                    — {note.text}
                  </p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-text-tertiary hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "planejamento" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Plano */}
            <div className="border border-line rounded-card bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs text-text-tertiary uppercase tracking-wide">Plano</h3>
                {!editingPlan && (
                  <button
                    onClick={() => {
                      setPlanDraft(client.plan ?? "");
                      setEditingPlan(true);
                    }}
                    className="text-text-tertiary hover:text-champagne transition-colors"
                  >
                    <Pencil size={13} strokeWidth={1.5} />
                  </button>
                )}
              </div>
              {editingPlan ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={planDraft}
                    onChange={(e) => setPlanDraft(e.target.value)}
                    rows={10}
                    className="bg-card-alt border border-line rounded-card p-3 text-sm outline-none focus:border-champagne transition-colors resize-none w-full"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingPlan(false)}
                      className="text-xs text-text-tertiary hover:text-text px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={savePlan}
                      className="text-xs bg-champagne text-black rounded-card px-3 py-1.5 hover:opacity-90"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {client.plan ? (
                    <div className="flex flex-col gap-3">
                      {splitPlan(client.plan).map((part, i) => {
                        const hasLabel = planLabelRegex.test(part);
                        const idx = part.indexOf(":");
                        return (
                          <p key={i} className="text-text leading-relaxed whitespace-pre-wrap">
                            {hasLabel ? (
                              <>
                                <span className="text-champagne font-medium">
                                  {part.slice(0, idx + 1)}
                                </span>
                                {part.slice(idx + 1)}
                              </>
                            ) : (
                              part
                            )}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-text">—</p>
                  )}
                </>
              )}
            </div>

            {/* Tabela de conteúdo */}
            <div className="border border-line rounded-card bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
                  <ListChecks size={14} className="text-champagne" strokeWidth={1.5} />
                  Conteúdo
                </h3>
                <button
                  onClick={() => createItem()}
                  className="flex items-center gap-1.5 text-xs bg-champagne text-black rounded-card px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  Novo conteúdo
                </button>
              </div>

              <ContentTable
                items={items}
                onFieldChange={updateItemField}
                onExpand={(id) => setExpandedItemId(id)}
              />
            </div>
          </div>

          {/* Status do planejamento */}
          <div className="border border-line rounded-card bg-card p-6 h-fit">
            <h3 className="flex items-center gap-2 text-base font-medium mb-5">
              <BarChart3 size={16} className="text-champagne" strokeWidth={1.5} />
              Status do planejamento
            </h3>
            <div className="flex flex-col gap-5">
              {statusOrder.map((status) => {
                const count = items.filter((i) => i.status === status).length;
                const pct = Math.round((count / total) * 100);
                const StatusIcon = statusIcons[status];
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <StatusIcon size={13} className="text-champagne" strokeWidth={1.5} />
                        {statusLabels[status]}
                      </span>
                      <span className="text-text-secondary">
                        {count} / {items.length}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-badge bg-card-alt overflow-hidden">
                      <div
                        className="h-full bg-champagne transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1 text-right">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "calendario" && (
        <CalendarioEditorial
          items={items}
          onCreate={(iso) => createItem(iso)}
          onExpand={(id) => setExpandedItemId(id)}
          onMove={moveItemDate}
        />
      )}

      {expandedItem && (
        <ContentDetailPanel
          item={expandedItem}
          onClose={() => setExpandedItemId(null)}
          onFieldChange={updateItemField}
          onDelete={() => deleteContentItem(expandedItem.id)}
        />
      )}
    </div>
  );
}