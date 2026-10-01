import { createClient } from "../lib/supabase/server";
import { CalendarioClient } from "./CalendarioClient";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("mt_content_items")
    .select("id, title, status, date, client_id")
    .not("date", "is", null);

  const clientIds = [...new Set((items ?? []).map((item) => item.client_id))];

  const { data: clientsForCalendar } = await supabase
    .from("mt_clients")
    .select("id, name")
    .in("id", clientIds.length > 0 ? clientIds : ["00000000-0000-0000-0000-000000000000"]);

  const clientNameById = new Map(
    (clientsForCalendar ?? []).map((c) => [c.id, c.name])
  );

  const events = (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    date: item.date as string,
    clientId: item.client_id,
    clientName: clientNameById.get(item.client_id) ?? "",
  }));

  return <CalendarioClient events={events} />;
}