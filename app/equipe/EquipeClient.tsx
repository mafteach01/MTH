"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Mail, ArrowRight, UserCheck } from "lucide-react";
import { createClient } from "../lib/supabase/client";

type Member = { id: string; name: string; role: string; email: string | null; status: string };
type Team = { id: string; name: string };
type RosterEntry = { id: string; team_id: string; team_member_id: string; role: string };

export function EquipeClient({
  members,
  teams,
  roster,
  isAdmin,
}: {
  members: Member[];
  teams: Team[];
  roster: RosterEntry[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const approvedMembers = members.filter((m) => m.status === "approved");
  const pendingMembers = members.filter((m) => m.status === "pending");

  async function handleApprove(memberId: string) {
    setApprovingId(memberId);
    await supabase.from("mt_team_members").update({ status: "approved" }).eq("id", memberId);
    setApprovingId(null);
    router.refresh();
  }

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-3xl font-medium">
          <Users size={22} className="text-champagne" strokeWidth={1.5} />
          Equipe
        </h2>
        <Link
          href="/equipes"
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-champagne transition-colors"
        >
          Gerenciar equipes
          <ArrowRight size={13} strokeWidth={1.5} />
        </Link>
      </div>

      {isAdmin && pendingMembers.length > 0 && (
        <div className="border border-champagne/30 rounded-card bg-champagne/10 p-6 flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm font-medium text-champagne">
            <UserCheck size={15} strokeWidth={1.5} />
            Contas aguardando aprovação ({pendingMembers.length})
          </p>

          <div className="flex flex-col gap-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border border-line rounded-card bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.email && (
                    <p className="text-xs text-text-tertiary">{member.email}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(member.id)}
                  disabled={approvingId === member.id}
                  className="text-xs bg-champagne text-black font-medium px-3 py-1.5 rounded-card hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {approvingId === member.id ? "Aprovando..." : "Aprovar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {approvedMembers.map((member) => {
          const memberRoster = roster.filter((r) => r.team_member_id === member.id);

          return (
            <div
              key={member.id}
              className="border border-line rounded-card bg-card p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-card-alt border border-line flex items-center justify-center text-champagne shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                </div>
              </div>

              {member.email && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Mail size={13} strokeWidth={1.5} />
                  {member.email}
                </div>
              )}

              <div className="border-t border-line pt-4">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
                  Equipes
                </p>

                <div className="flex flex-col gap-1.5">
                  {memberRoster.map((entry) => {
                    const team = teamById.get(entry.team_id);
                    return (
                      <div key={entry.id} className="flex items-center gap-2 text-sm">
                        <span className="text-text-secondary">{team?.name ?? "—"}</span>
                        <span className="text-text-tertiary">·</span>
                        <span className="text-champagne text-xs">{entry.role}</span>
                      </div>
                    );
                  })}
                  {memberRoster.length === 0 && (
                    <p className="text-sm text-text-tertiary italic">
                      Não está em nenhuma equipe ainda.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
