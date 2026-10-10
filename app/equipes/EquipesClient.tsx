"use client";

import { useState } from "react";
import { Shield, Plus, Pencil } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { TeamSidebar } from "./TeamSidebar";

type Team = { id: string; name: string };
type RosterEntry = { id: string; team_id: string; team_member_id: string; role: string };
type Member = { id: string; name: string };

export function EquipesClient({
  teams: initialTeams,
  initialRoster,
  members,
}: {
  teams: Team[];
  initialRoster: RosterEntry[];
  members: Member[];
}) {
  const [supabase] = useState(() => createClient());
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [roster, setRoster] = useState<RosterEntry[]>(initialRoster);
  const [saving, setSaving] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const editingTeam = teams.find((t) => t.id === editingTeamId) ?? null;

  async function createTeam(name: string): Promise<Team | null> {
    if (!name.trim()) return null;
    setSaving(true);

    const { data, error } = await supabase
      .from("mt_teams")
      .insert({ name })
      .select()
      .single();

    setSaving(false);
    if (error || !data) {
      alert("Erro ao criar equipe: " + (error?.message ?? "desconhecido"));
      return null;
    }
    const newTeam = { id: data.id, name: data.name };
    setTeams((current) => [...current, newTeam]);
    return newTeam;
  }

  async function deleteTeam(teamId: string) {
    if (!confirm("Apagar essa equipe? Isso remove todos os vínculos dela.")) return;
    setSaving(true);
    const { error } = await supabase.from("mt_teams").delete().eq("id", teamId);
    setSaving(false);
    if (error) {
      alert("Erro ao apagar equipe: " + error.message);
      return;
    }
    setTeams((current) => current.filter((t) => t.id !== teamId));
    setRoster((current) => current.filter((r) => r.team_id !== teamId));
    setSidebarOpen(false);
    setEditingTeamId(null);
  }

  async function addToRoster(teamId: string, memberId: string, role: string) {
    if (!memberId || !role.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("mt_team_roster")
      .insert({ team_id: teamId, team_member_id: memberId, role })
      .select()
      .single();

    setSaving(false);
    if (error || !data) {
      alert("Erro ao adicionar: " + (error?.message ?? "desconhecido"));
      return;
    }
    setRoster((current) => [
      ...current,
      { id: data.id, team_id: data.team_id, team_member_id: data.team_member_id, role: data.role },
    ]);
  }

  async function removeFromRoster(entryId: string) {
    setSaving(true);
    const { error } = await supabase.from("mt_team_roster").delete().eq("id", entryId);
    setSaving(false);
    if (error) {
      alert("Erro ao remover: " + error.message);
      return;
    }
    setRoster((current) => current.filter((r) => r.id !== entryId));
  }

  function openCreateSidebar() {
    setEditingTeamId(null);
    setSidebarOpen(true);
  }

  function openEditSidebar(teamId: string) {
    setEditingTeamId(teamId);
    setSidebarOpen(true);
  }

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-medium">
          <Shield size={22} className="text-champagne" strokeWidth={1.5} />
          Equipes
        </h2>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-text-tertiary">salvando...</span>}
          <button
            onClick={openCreateSidebar}
            className="flex items-center gap-1.5 text-sm bg-champagne text-black rounded-card px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            <Plus size={15} strokeWidth={2} />
            Nova equipe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {teams.map((team) => {
          const teamRoster = roster.filter((r) => r.team_id === team.id);
          return (
            <div
              key={team.id}
              className="min-w-0 border border-line rounded-card bg-card p-5 md:p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium break-words">{team.name}</h3>
                <button
                  onClick={() => openEditSidebar(team.id)}
                  className="text-text-tertiary hover:text-champagne transition-colors shrink-0"
                >
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {teamRoster.map((entry) => {
                  const member = memberById.get(entry.team_member_id);
                  return (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
                    >
                      <span className="break-all">{member?.name ?? "—"}</span>
                      <span className="text-text-tertiary">·</span>
                      <span className="text-champagne text-xs">{entry.role}</span>
                    </div>
                  );
                })}
                {teamRoster.length === 0 && (
                  <p className="text-sm text-text-tertiary italic">Nenhum membro ainda.</p>
                )}
              </div>
            </div>
          );
        })}
        {teams.length === 0 && (
          <p className="text-text-tertiary text-sm md:col-span-2">
            Nenhuma equipe criada ainda.
          </p>
        )}
      </div>

      {sidebarOpen && (
        <TeamSidebar
          team={editingTeam}
          roster={roster}
          members={members}
          saving={saving}
          onClose={() => {
            setSidebarOpen(false);
            setEditingTeamId(null);
          }}
          onCreateTeam={createTeam}
          onDeleteTeam={deleteTeam}
          onAddToRoster={addToRoster}
          onRemoveFromRoster={removeFromRoster}
          onTeamCreated={(newTeam) => setEditingTeamId(newTeam.id)}
        />
      )}
    </div>
  );
}
