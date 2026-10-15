import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { sendPushToUser } from "@/app/lib/supabase/push";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { itemId?: string };
  const itemId = body.itemId;

  if (!itemId || !uuidRegex.test(itemId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { data: item } = await supabase
    .from("mt_content_items")
    .select("id, client_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: client } = await supabase
    .from("mt_clients")
    .select("id, name, responsible_id, team_id")
    .eq("id", item.client_id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();

  const memberIds = new Set<string>();
  if (client.responsible_id) memberIds.add(client.responsible_id);

  if (client.team_id) {
    const { data: roster } = await admin
      .from("mt_team_roster")
      .select("team_member_id")
      .eq("team_id", client.team_id);
    (roster ?? []).forEach((r) => memberIds.add(r.team_member_id));
  }

  if (memberIds.size === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: members } = await admin
    .from("mt_team_members")
    .select("user_id, status")
    .in("id", Array.from(memberIds));

  const userIds = Array.from(
    new Set(
      (members ?? [])
        .filter(
          (m) => m.user_id && m.status !== "pending" && m.user_id !== user.id
        )
        .map((m) => m.user_id as string)
    )
  );

  await Promise.all(
    userIds.map((uid) =>
      sendPushToUser(uid, "novos_itens", {
        title: `Novo conteúdo em ${client.name}`,
        body: "Um novo item entrou no planejamento.",
        url: `/clientes/${client.id}`,
        tag: `novo-item-${item.id}`,
      })
    )
  );

  return NextResponse.json({ ok: true, sent: userIds.length });
}