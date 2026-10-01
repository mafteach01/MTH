import { createClient } from "../../lib/supabase/server";
import { NovoClienteForm } from "./NovoClienteForm";

export default async function NovoClientePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentMember } = await supabase
    .from("mt_team_members")
    .select("is_admin")
    .eq("user_id", user?.id)
    .single();

  const { data: team } = await supabase
    .from("mt_team_members")
    .select("id, name")
    .order("name");

  const { data: teams } = await supabase
    .from("mt_teams")
    .select("id, name")
    .order("name");

  return (
    <NovoClienteForm
      team={team ?? []}
      teams={teams ?? []}
      isAdmin={currentMember?.is_admin ?? false}
    />
  );
}