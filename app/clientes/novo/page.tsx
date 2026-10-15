import { createClient } from "../../lib/supabase/server";
import { NovoClienteForm } from "./NovoClienteForm";

export default async function NovoClientePage() {
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("mt_team_members")
    .select("id, name")
    .order("name");

  const { data: teams } = await supabase
    .from("mt_teams")
    .select("id, name")
    .order("name");

  return <NovoClienteForm team={team ?? []} teams={teams ?? []} />;
}