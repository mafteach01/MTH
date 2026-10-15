import { notFound } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { ApprovalClient, type ApprovalItem } from "./ApprovalClient";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AprovarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!uuidRegex.test(token)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mt_get_approval_portal", {
    p_token: token,
  });

  if (error || !data) notFound();

  const portal = data as { client_name: string; items: ApprovalItem[] };

  return (
    <ApprovalClient
      token={token}
      clientName={portal.client_name}
      initialItems={portal.items}
    />
  );
}