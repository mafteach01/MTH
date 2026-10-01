"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { createClient } from "../lib/supabase/client";

export default function AguardandoAprovacaoPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: member } = await supabase
        .from("mt_team_members")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (member?.status === "approved") {
        router.push("/");
        router.refresh();
        return;
      }

      setChecking(false);
    }

    checkStatus();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (checking) {
    return <div className="min-h-screen bg-bg" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <div className="w-12 h-12 rounded-full bg-card-alt border border-line flex items-center justify-center text-champagne">
          <Clock3 size={20} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-medium">Conta aguardando aprovação</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Sua conta foi criada, mas ainda precisa ser aprovada por um admin da Mafteach.
            Assim que isso acontecer, você já vai conseguir acessar o painel normalmente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer border border-line rounded-card px-4 py-2"
        >
          Sair
        </button>
      </div>
    </div>
  );
}