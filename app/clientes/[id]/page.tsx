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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentMember } = await supabase
    .from("mt_team_members")
    .select("is_admin")
    .eq("user_id", user?.id)
    .single();

  const isAdmin = currentMember?.is_admin ?? false;

  const { data: rawClient, error: clientError } = await supabase
    .from("mt_clients_secure")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !rawClient) notFound();

  // troca os campos de Instagram pelos campos "masked" da view
  // (que já vêm null automaticamente se quem está logado não é admin)
  const client = {
    ...rawClient,
    instagram_login: rawClient.instagram_login_masked,
    instagram_password: rawClient.instagram_password_masked,
  };

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
      isAdmin={isAdmin}
    />
  );
}