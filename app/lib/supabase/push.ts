import webpush from "web-push";
import { createAdminClient } from "@/app/lib/supabase/admin";

export type PushKind =
  | "aprovacoes"
  | "posts_do_dia"
  | "novos_itens"
  | "notas_equipe";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let configured = false;

function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export async function sendPushToUser(
  userId: string,
  kind: PushKind,
  payload: PushPayload
) {
  configure();
  const admin = createAdminClient();

  const { data: prefs } = await admin
    .from("mt_notification_prefs")
    .select("aprovacoes, posts_do_dia, novos_itens, notas_equipe")
    .eq("user_id", userId)
    .maybeSingle();

  const defaults = {
    aprovacoes: true,
    posts_do_dia: true,
    novos_itens: true,
    notas_equipe: false,
  };
  const enabled = prefs ? prefs[kind] : defaults[kind];
  if (!enabled) return;

  const { data: subs } = await admin
    .from("mt_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  const message = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
        console.log("push enviado", userId, kind);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        console.error("push falhou", userId, kind, status, (err as Error).message);
        if (status === 404 || status === 410) {
          await admin.from("mt_push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}