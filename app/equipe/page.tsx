import { createClient } from "../lib/supabase/server";
import { EquipeClient } from "./EquipeClient";

export default async function EquipePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentMember } = await supabase
    .from("mt_team_members")
    .select("is_admin")
    .eq("user_id", user?.id)
    .single();

  const { data: members } = await supabase
    .from("mt_team_members")
    .select("id, name, role, email, status")
    .order("name");

  const { data: teams } = await supabase
    .from("mt_teams")
    .select("id, name")
    .order("name");

  const { data: roster } = await supabase
    .from("mt_team_roster")
    .select("id, team_id, team_member_id, role");

  return (
    <EquipeClient
      members={members ?? []}
      teams={teams ?? []}
      roster={roster ?? []}
      isAdmin={currentMember?.is_admin ?? false}
    />
  );
}