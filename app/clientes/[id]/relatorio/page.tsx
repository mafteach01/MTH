import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { RelatorioClient, type ReportItem } from "./RelatorioClient";

export default async function RelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("mt_clients")
    .select("id, name, instagram_handle")
    .eq("id", id)
    .single();

  if (clientError || !client) notFound();

  const { data: items } = await supabase
    .from("mt_content_items")
    .select(
      "id, title, tipo_conteudo, published_at, published_url, metric_reach, metric_saves, metric_shares, metric_clicks"
    )
    .eq("client_id", id)
    .eq("status", "publicado")
    .not("published_at", "is", null)
    .order("published_at");

  return (
    <RelatorioClient
      clientId={client.id}
      clientName={client.name}
      instagramHandle={client.instagram_handle}
      items={(items ?? []) as ReportItem[]}
    />
  );
}