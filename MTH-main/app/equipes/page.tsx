import { createClient } from "../lib/supabase/server";
import { EquipesClient } from "./EquipesClient";

export default async function EquipesPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("mt_teams")
    .select("id, name")
    .order("name");

  const { data: roster } = await supabase
    .from("mt_team_roster")
    .select("id, team_id, team_member_id, role");

  const { data: members } = await supabase
    .from("mt_team_members")
    .select("id, name")
    .eq("status", "approved")
    .order("name");

  return (
    <EquipesClient
      teams={teams ?? []}
      initialRoster={roster ?? []}
      members={members ?? []}
    />
  );
}