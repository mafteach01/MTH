import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "../lib/supabase/server";
import { Badge } from "../components/ui/Badge";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from("mt_clients")
    .select("id, name, objective, status, last_content")
    .order("name");

  if (error) {
    return (
      <div className="p-4 md:p-10">
        <p className="text-sm text-red-400">Erro ao carregar clientes: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl font-medium">Clientes</h2>
          <p className="text-text-secondary text-sm mt-1">
            {clients?.length ?? 0} clientes na base.
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-2 bg-champagne text-bg text-sm font-medium rounded-card px-3 md:px-4 py-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Novo cliente</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      <div className="border border-line rounded-card bg-card divide-y divide-line">
        {clients?.map((client) => (
          <Link
            key={client.id}
            href={`/clientes/${client.id}`}
            className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-card-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-card-alt border border-line flex items-center justify-center text-sm text-champagne shrink-0">
              {client.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{client.name}</p>
              <p className="text-xs text-text-tertiary truncate mt-0.5">{client.objective}</p>
            </div>
            <span className="text-xs text-text-secondary shrink-0 hidden sm:block">
              {client.last_content}
            </span>
            <Badge label={client.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}