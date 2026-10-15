import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { sendPushToUser } from "@/app/lib/supabase/push";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const { data: items } = await admin
    .from("mt_content_items")
    .select("id, client_id")
    .eq("scheduled_date", today)
    .neq("status", "publicado");

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: true, posts: 0, sent: 0 });
  }

  const clientIds = Array.from(new Set(items.map((i) => i.client_id as string)));

  const { data: clients } = await admin
    .from("mt_clients")
    .select("id, responsible_id, team_id")
    .in("id", clientIds);

  const teamIds = Array.from(
    new Set(
      (clients ?? [])
        .map((c) => c.team_id as string | null)
        .filter((t): t is string => !!t)
    )
  );

  const rosterByTeam = new Map<string, string[]>();
  if (teamIds.length > 0) {
    const { data: roster } = await admin
      .from("mt_team_roster")
      .select("team_id, team_member_id")
      .in("team_id", teamIds);
    (roster ?? []).forEach((r) => {
      const list = rosterByTeam.get(r.team_id as string) ?? [];
      list.push(r.team_member_id as string);
      rosterByTeam.set(r.team_id as string, list);
    });
  }

  const postsByClient = new Map<string, number>();
  items.forEach((i) => {
    const cid = i.client_id as string;
    postsByClient.set(cid, (postsByClient.get(cid) ?? 0) + 1);
  });

  const countByMember = new Map<string, number>();
  (clients ?? []).forEach((c) => {
    const posts = postsByClient.get(c.id as string) ?? 0;
    const members = new Set<string>();
    if (c.responsible_id) members.add(c.responsible_id as string);
    (rosterByTeam.get(c.team_id as string) ?? []).forEach((m) => members.add(m));
    members.forEach((m) =>
      countByMember.set(m, (countByMember.get(m) ?? 0) + posts)
    );
  });

  const memberIds = Array.from(countByMember.keys());
  if (memberIds.length === 0) {
    return NextResponse.json({ ok: true, posts: items.length, sent: 0 });
  }

  const { data: members } = await admin
    .from("mt_team_members")
    .select("id, user_id, status")
    .in("id", memberIds);

  let sent = 0;
  await Promise.all(
    (members ?? [])
      .filter((m) => m.user_id && m.status !== "pending")
      .map(async (m) => {
        const n = countByMember.get(m.id as string) ?? 0;
        if (n === 0) return;
        sent += 1;
        await sendPushToUser(m.user_id as string, "posts_do_dia", {
          title: "Posts de hoje",
          body:
            n === 1
              ? "Você tem 1 post agendado pra hoje."
              : `Você tem ${n} posts agendados pra hoje.`,
          url: "/calendario",
          tag: "posts-do-dia",
        });
      })
  );

  return NextResponse.json({ ok: true, posts: items.length, sent });
}