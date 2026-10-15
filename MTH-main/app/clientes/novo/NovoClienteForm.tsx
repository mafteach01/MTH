"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, IdCard, Briefcase, Lock as LockIcon } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type TipoPessoa = "fisica" | "juridica";
type NivelGestao = "total" | "aprovacao" | "parcial";
type TeamMember = { id: string; name: string };
type Team = { id: string; name: string };

export function NovoClienteForm({ team, teams }: { team: TeamMember[]; teams: Team[] }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("fisica");
  const [nivelGestao, setNivelGestao] = useState<NivelGestao>("total");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractStatus, setContractStatus] = useState("Ativo");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [objective, setObjective] = useState("");
  const [responsibleId, setResponsibleId] = useState(team[0]?.id ?? "");
  const [teamId, setTeamId] = useState("");
  const [productionStatus, setProductionStatus] = useState("Em planejamento");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("O nome do cliente é obrigatório.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("mt_clients")
      .insert({
        name,
        person_type: tipoPessoa,
        document: document || null,
        email: email || null,
        phone: phone || null,
        contract_value: contractValue || null,
        due_day: dueDay ? Number(dueDay) : null,
        contract_start: contractStart || null,
        contract_status: contractStatus,
        management_level: nivelGestao,
        instagram_handle: instagramHandle || null,
        objective: objective || null,
        responsible_id: responsibleId || null,
        team_id: teamId || null,
        status: productionStatus,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setErrorMsg("Erro ao salvar: " + error.message);
      return;
    }

    router.push(`/clientes/${data.id}`);
  }

  return (
    <div className="p-10 flex flex-col gap-8 max-w-2xl">
      <Link
        href="/clientes"
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-champagne w-fit"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Clientes
      </Link>

      <h2 className="flex items-center gap-2 text-3xl font-medium">
        <UserPlus size={22} className="text-champagne" strokeWidth={1.5} />
        Novo cliente
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Identificação */}
        <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-5">
          <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
            <IdCard size={14} className="text-champagne" strokeWidth={1.5} />
            Identificação
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipoPessoa("fisica")}
                className={`flex-1 text-sm py-2 rounded-card border transition-colors ${
                  tipoPessoa === "fisica"
                    ? "border-champagne text-champagne"
                    : "border-line text-text-secondary hover:border-line-strong"
                }`}
              >
                Pessoa física
              </button>
              <button
                type="button"
                onClick={() => setTipoPessoa("juridica")}
                className={`flex-1 text-sm py-2 rounded-card border transition-colors ${
                  tipoPessoa === "juridica"
                    ? "border-champagne text-champagne"
                    : "border-line text-text-secondary hover:border-line-strong"
                }`}
              >
                Pessoa jurídica
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">
              {tipoPessoa === "fisica" ? "Nome completo" : "Razão social"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tipoPessoa === "fisica" ? "Ex: Ana Ferraz" : "Ex: Combo Fit Suplementos LTDA"}
              className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">
              {tipoPessoa === "fisica" ? "CPF" : "CNPJ"}
            </label>
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder={tipoPessoa === "fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
              className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        {/* Comercial */}
        <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-5">
          <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
            <Briefcase size={14} className="text-champagne" strokeWidth={1.5} />
            Comercial
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Valor do contrato</label>
              <input
                type="text"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                placeholder="R$ 0,00 / mês"
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Dia de vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="Ex: 10"
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Início do contrato</label>
              <input
                type="date"
                value={contractStart}
                onChange={(e) => setContractStart(e.target.value)}
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Status do contrato</label>
              <select
                value={contractStatus}
                onChange={(e) => setContractStatus(e.target.value)}
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors"
              >
                <option>Ativo</option>
                <option>Pausado</option>
                <option>Encerrado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gestão da conta */}
        <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-5">
          <h3 className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide">
            <LockIcon size={14} className="text-champagne" strokeWidth={1.5} />
            Gestão da conta
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Nível de gestão</label>
            <select
              value={nivelGestao}
              onChange={(e) => setNivelGestao(e.target.value as NivelGestao)}
              className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors"
            >
              <option value="total">Administração total</option>
              <option value="aprovacao">Aprovação e envio</option>
              <option value="parcial">Acesso parcial</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">@ do Instagram</label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@usuario"
              className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Operacional */}
        <div className="border border-line rounded-card bg-card p-6 flex flex-col gap-5">
          <h3 className="text-xs text-text-tertiary uppercase tracking-wide">Operacional</h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Objetivo</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Qual o objetivo definido com esse cliente?"
              rows={3}
              className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Responsável interno</label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors"
              >
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Status de produção</label>
              <select
                value={productionStatus}
                onChange={(e) => setProductionStatus(e.target.value)}
                className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors"
              >
                <option>Em planejamento</option>
                <option>Em produção</option>
                <option>Ativo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Equipe vinculada</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="bg-card-alt border border-line rounded-card px-3 py-2.5 text-sm outline-none focus:border-champagne transition-colors"
            >
              <option value="">Nenhuma equipe (definir depois)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

        <div className="flex justify-end gap-3">
          <Link
            href="/clientes"
            className="text-sm text-text-secondary hover:text-text px-4 py-2.5 rounded-card border border-line transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-champagne text-black text-sm font-medium px-5 py-2.5 rounded-card hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}