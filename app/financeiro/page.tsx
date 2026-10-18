import { createClient } from "@/app/lib/supabase/server";
import FinanceiroClient from "./FinanceiroClient";

function mesAtual() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).slice(0, 7);
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sp = await searchParams;
  const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? (sp.mes as string) : mesAtual();

  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("mt_clients")
    .select("id, name, contract_value, due_day")
    .order("name");

  const { data: payments } = await supabase
    .from("mt_client_payments")
    .select("id, client_id, mes, valor, pago, pago_em, comprovante_path")
    .eq("mes", mes);

  return (
    <FinanceiroClient
      mes={mes}
      hoje={mesAtual()}
      clients={clients ?? []}
      payments={payments ?? []}
    />
  );
}