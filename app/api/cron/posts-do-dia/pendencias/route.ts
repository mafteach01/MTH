import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { sendPushToUser } from "@/app/lib/supabase/push";

function somaDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const { data: atrasados } = await admin
    .from("mt_content_items")
    .select("id, client_id")
    .lt("scheduled_date", today)
    .gte("scheduled_date", somaDias(today, -30))
    .neq("status", "publicado");

  const { data: aprovacao } = await admin
    .from("mt_content_items")
    .select("id, client_id")
    .eq("status", "aprovacao")
    .gte("scheduled_date", today)
    .lte("scheduled_date", somaDias(today, 2));

  const atrasadosPorCliente = new Map<string, number>();
  (atrasados ?? []).forEach((i) => {
    const cid = i.client_id as string;
    atrasadosPorCliente.set(cid, (atrasadosPorCliente.get(cid) ?? 0) + 1);
  });

  const aprovacaoPorCliente = new Map<string, number>();
  (aprovacao ?? []).forEach((i) => {
    const cid = i.client_id as string;
    aprovacaoPorCliente.set(cid, (aprovacaoPorCliente.get(cid) ?? 0) + 1);
  });

  const clientIds = Array.from(
    new Set([...atrasadosPorCliente.keys(), ...aprovacaoPorCliente.keys()])
  );

  if (clientIds.length === 0) {
    return NextResponse.json({ ok: true, atrasados: 0, aprovacao: 0, sent: 0 });
  }

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

  const porMembro = new Map<string, { atr: number; apr: number }>();
  (clients ?? []).forEach((c) => {
    const atr = atrasadosPorCliente.get(c.id as string) ?? 0;
    const apr = aprovacaoPorCliente.get(c.id as string) ?? 0;
    const membros = new Set<string>();
    if (c.responsible_id) membros.add(c.responsible_id as string);
    (rosterByTeam.get(c.team_id as string) ?? []).forEach((m) => membros.add(m));
    membros.forEach((m) => {
      const atual = porMembro.get(m) ?? { atr: 0, apr: 0 };
      porMembro.set(m, { atr: atual.atr + atr, apr: atual.apr + apr });
    });
  });

  const memberIds = Array.from(porMembro.keys());
  if (memberIds.length === 0) {
    return NextResponse.json({
      ok: true,
      atrasados: atrasados?.length ?? 0,
      aprovacao: aprovacao?.length ?? 0,
      sent: 0,
    });
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
        const c = porMembro.get(m.id as string);
        if (!c || (c.atr === 0 && c.apr === 0)) return;

        const partes: string[] = [];
        if (c.atr > 0) {
          partes.push(
            c.atr === 1 ? "1 conteúdo atrasado" : `${c.atr} conteúdos atrasados`
          );
        }
        if (c.apr > 0) {
          partes.push(`${c.apr} aguardando aprovação`);
        }

        sent += 1;
        await sendPushToUser(m.user_id as string, "posts_do_dia", {
          title: "Pendências",
          body: partes.join(" · "),
          url: "/calendario",
          tag: "pendencias",
        });
      })
  );

  return NextResponse.json({
    ok: true,
    atrasados: atrasados?.length ?? 0,
    aprovacao: aprovacao?.length ?? 0,
    sent,
  });
}