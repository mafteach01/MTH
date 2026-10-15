import { notFound } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { ClientDetail } from "./ClientDetail";

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Lista explícita de colunas: o app não lê nem grava credenciais de Instagram.
  const { data: client, error: clientError } = await supabase
    .from("mt_clients")
    .select(
      "id, name, objective, plan, status, last_content, person_type, document, email, phone, contract_value, due_day, contract_start, contract_status, management_level, instagram_handle, responsible_id, team_id, approval_token"
    )
    .eq("id", id)
    .single();

  if (clientError || !client) notFound();

  const { data: items } = await supabase
    .from("mt_content_items")
    .select("*")
    .eq("client_id", id)
    .order("created_at");

  const { data: notes } = await supabase
    .from("mt_client_notes")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: team } = await supabase
    .from("mt_team_members")
    .select("id, name")
    .order("name");

  const { data: teams } = await supabase
    .from("mt_teams")
    .select("id, name")
    .order("name");

  const { data: roster } = await supabase
    .from("mt_team_roster")
    .select("id, team_id, team_member_id, role");

  return (
    <ClientDetail
      client={client}
      initialItems={items ?? []}
      notes={notes ?? []}
      team={team ?? []}
      teams={teams ?? []}
      roster={roster ?? []}
    />
  );
}