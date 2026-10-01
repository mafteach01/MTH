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

  const { data: client, error: clientError } = await supabase
    .from("mt_clients")
    .select("*")
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