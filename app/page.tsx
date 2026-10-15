import {
  Users,
  Calendar,
  PlayCircle,
  CheckCircle2,
  Zap,
  BarChart3,
  FileText,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "./components/ui/Badge";
import { createClient } from "./lib/supabase/server";

const statusLabels: Record<string, string> = {
  ideia: "Ideias",
  roteiro: "Roteiro",
  producao: "Produção",
  aprovacao: "Aprovação",
  publicado: "Publicado",
};

const statusOrder = ["ideia", "roteiro", "producao", "aprovacao", "publicado"];

export default async function Home() {
  const supabase = await createClient();


  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const hora = Number(
  new Intl.DateTimeFormat("pt-BR", {
    hour: "numeric",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(new Date())
);
const saudacao =
  hora >= 5 && hora < 12
    ? "Bom dia"
    : hora >= 12 && hora < 18
    ? "Boa tarde"
    : "Boa noite";

  // Contagem de clientes por status de produção
  const { count: countAtivo, error: errAtivo } = await supabase
    .from("mt_clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "Ativo");

  const { count: countPlanejamento } = await supabase
    .from("mt_clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "Em planejamento");

  const { count: countProducao } = await supabase
    .from("mt_clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "Em produção");

  const { count: countPublicados } = await supabase
    .from("mt_content_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado");

  const stats = [
    { label: "Clientes ativos", value: countAtivo ?? 0, icon: Users },
    { label: "Em planejamento", value: countPlanejamento ?? 0, icon: Calendar },
    { label: "Em produção", value: countProducao ?? 0, icon: PlayCircle },
    { label: "Conteúdos publicados", value: countPublicados ?? 0, icon: CheckCircle2 },
  ];

  // Status geral: contagem de itens de conteúdo por etapa, somando todos os clientes
  const { data: allItems } = await supabase.from("mt_content_items").select("status");
  const totalItems = allItems?.length || 1;

  const statusGeral = statusOrder.map((status) => {
    const value = allItems?.filter((i) => i.status === status).length ?? 0;
    return { label: statusLabels[status], value, total: totalItems };
  });

  // Clientes mais recentes
  const { data: clientesRecentes } = await supabase
    .from("mt_clients")
    .select("id, name, status, last_content")
    .order("created_at", { ascending: false })
    .limit(5);

  // Atividade recente: últimos itens de conteúdo, com nome do cliente
  const { data: recentItemsRaw } = await supabase
    .from("mt_content_items")
    .select("id, title, status, scheduled_date, created_at, client_id")
    .order("created_at", { ascending: false })
    .limit(6);

  const clientIds = [...new Set((recentItemsRaw ?? []).map((item) => item.client_id))];

  const { data: clientsForActivity } = await supabase
    .from("mt_clients")
    .select("id, name")
    .in("id", clientIds.length > 0 ? clientIds : ["00000000-0000-0000-0000-000000000000"]);

  const clientNameById = new Map(
    (clientsForActivity ?? []).map((c) => [c.id, c.name])
  );

  const recentItems = (recentItemsRaw ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    meta: `Cliente: ${clientNameById.get(item.client_id) ?? "—"}`,
    date: item.scheduled_date
      ? item.scheduled_date.split("-").reverse().join("/")
      : "—",
    status: statusLabels[item.status] ?? item.status,
  }));

  return (
<div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8">
<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
<h2 className="text-2xl md:text-3xl font-medium">Visão geral</h2>
          <p className="text-text mt-2">{saudacao}, equipe Mafteach.</p>
          <p className="text-text-secondary text-sm mt-1">
            Aqui você acompanha o andamento dos nossos clientes e conteúdos.
          </p>
        </div>
<div className="flex items-center gap-2 border border-line rounded-card px-3 py-2 text-sm text-text-secondary shrink-0 w-fit">
          <Calendar size={14} strokeWidth={1.5} />
          {today}
        </div>
      </div>

<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-line rounded-card p-5 bg-card">
            <div className="flex items-center justify-between text-text-tertiary mb-4">
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-3xl mt-1 font-medium">{value}</p>
          </div>
        ))}
      </div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div className="lg:col-span-2 border border-line rounded-card bg-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-base font-medium">
              <Zap size={16} className="text-champagne" strokeWidth={1.5} />
              Atividade recente
            </h3>
            <a href="#" className="text-sm text-text-secondary flex items-center gap-1 hover:text-champagne">
              Ver todos <ArrowRight size={14} />
            </a>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {recentItems.map(({ id, title, meta, date, status }) => (
<div key={id} className="flex items-center gap-3 md:gap-4 py-3">
                <div className="w-9 h-9 rounded-full border border-line flex items-center justify-center shrink-0">
                  <FileText size={15} strokeWidth={1.5} className="text-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
<p className="text-sm truncate">{title}</p>
                  <p className="text-xs text-text-tertiary truncate">{meta}</p>
                </div>
<span className="text-xs text-text-tertiary shrink-0 hidden sm:block">{date}</span>
                <Badge label={status} />
              </div>
            ))}
          </div>
        </div>

<div className="border border-line rounded-card bg-card p-4 md:p-6 h-fit">
          <h3 className="flex items-center gap-2 text-base font-medium mb-5">
            <BarChart3 size={16} className="text-champagne" strokeWidth={1.5} />
            Status geral
          </h3>
          <div className="flex flex-col gap-5">
            {statusGeral.map(({ label, value, total }) => {
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{label}</span>
                    <span className="text-text-secondary">{value} / {total}</span>
                  </div>
                  <div className="h-1.5 rounded-badge bg-card-alt overflow-hidden">
                    <div className="h-full bg-champagne" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-secondary mt-1 text-right">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

<div className="border border-line rounded-card bg-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <Users size={16} className="text-champagne" strokeWidth={1.5} />
            Clientes recentes
          </h3>
          <Link href="/clientes" className="text-sm text-text-secondary flex items-center gap-1 hover:text-champagne">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-tertiary text-xs border-b border-line">
              <th className="pb-2 font-normal">Cliente</th>
              <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal hidden sm:table-cell">Último conteúdo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {clientesRecentes?.map(({ id, name, status, last_content }) => (
              <tr key={id}>
                <td className="py-3">
                  <Link href={`/clientes/${id}`} className="flex items-center gap-3 hover:text-champagne">
                    <div className="w-7 h-7 rounded-full bg-card-alt border border-line" />
                    {name}
                  </Link>
                </td>
                <td>
                  <Badge label={status} />
                </td>
<td className="text-text-secondary hidden sm:table-cell">{last_content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}