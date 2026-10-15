import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { sendPushToUser } from "@/app/lib/supabase/push";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = {
  token?: string;
  itemId?: string;
  kind?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const { token, itemId, kind } = body;

  if (
    !token ||
    !itemId ||
    !uuidRegex.test(token) ||
    !uuidRegex.test(itemId) ||
    (kind !== "aprovado" && kind !== "ajuste")
  ) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: client } = await admin
    .from("mt_clients")
    .select("id, name, responsible_id, team_id")
    .eq("approval_token", token)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: item } = await admin
    .from("mt_content_items")
    .select("id, title, approval_status")
    .eq("id", itemId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (!item || item.approval_status !== kind) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

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
        .filter((m) => m.user_id && m.status !== "pending")
        .map((m) => m.user_id as string)
    )
  );

  const title =
    kind === "aprovado"
      ? `${client.name} aprovou`
      : `${client.name} pediu ajuste`;

  await Promise.all(
    userIds.map((uid) =>
      sendPushToUser(uid, "aprovacoes", {
        title,
        body: item.title,
        url: `/clientes/${client.id}`,
        tag: `aprovacao-${item.id}`,
      })
    )
  );

  return NextResponse.json({ ok: true, sent: userIds.length });
}