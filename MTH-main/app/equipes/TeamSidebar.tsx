"use client";

import { useState } from "react";
import { X, Trash2, Plus, Shield } from "lucide-react";

type Team = { id: string; name: string };
type RosterEntry = { id: string; team_id: string; team_member_id: string; role: string };
type Member = { id: string; name: string };

export function TeamSidebar({
  team,
  roster,
  members,
  saving,
  onClose,
  onCreateTeam,
  onDeleteTeam,
  onAddToRoster,
  onRemoveFromRoster,
  onTeamCreated,
}: {
  team: Team | null;
  roster: RosterEntry[];
  members: Member[];
  saving: boolean;
  onClose: () => void;
  onCreateTeam: (name: string) => Promise<Team | null>;
  onDeleteTeam: (teamId: string) => void;
  onAddToRoster: (teamId: string, memberId: string, role: string) => void;
  onRemoveFromRoster: (entryId: string) => void;
  onTeamCreated: (team: Team) => void;
}) {
  const [nameDraft, setNameDraft] = useState(team?.name ?? "");
  const [addMemberId, setAddMemberId] = useState("");
  const [addRole, setAddRole] = useState("");

  const teamRoster = team ? roster.filter((r) => r.team_id === team.id) : [];
  const rosterMemberIds = new Set(teamRoster.map((r) => r.team_member_id));
  const availableMembers = members.filter((m) => !rosterMemberIds.has(m.id));

  async function handleCreate() {
    const newTeam = await onCreateTeam(nameDraft);
    if (newTeam) onTeamCreated(newTeam);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border-l border-line h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2 text-text-tertiary">
            <Shield size={14} strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-wide">
              {team ? "Editar equipe" : "Nova equipe"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {team && (
              <button
                onClick={() => onDeleteTeam(team.id)}
                className="text-text-tertiary hover:text-red-400 transition-colors"
                title="Apagar equipe"
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            )}
            <button onClick={onClose} className="text-text-tertiary hover:text-text transition-colors">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 flex-1">
          {!team ? (
            <div className="flex flex-col gap-3">
              <label className="text-xs text-text-secondary">Nome da equipe</label>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                placeholder="Ex: Equipe Alpha"
                autoFocus
                className="bg-card-alt border border-line rounded-card px-3 py-2 text-sm outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
              />
              <button
                onClick={handleCreate}
                disabled={!nameDraft.trim() || saving}
                className="flex items-center justify-center gap-1.5 text-sm bg-champagne text-black rounded-card px-4 py-2.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Plus size={15} strokeWidth={2} />
                Criar equipe
              </button>
              <p className="text-xs text-text-tertiary italic">
                Depois de criar, você adiciona os membros aqui mesmo.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-text-secondary mb-1">Nome da equipe</p>
                <p className="text-lg font-medium">{team.name}</p>
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-3">
                  Membros
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  {teamRoster.map((entry) => {
                    const member = members.find((m) => m.id === entry.team_member_id);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between bg-card-alt border border-line rounded-card px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span>{member?.name ?? "—"}</span>
                          <span className="text-text-tertiary">·</span>
                          <span className="text-champagne text-xs">{entry.role}</span>
                        </div>
                        <button
                          onClick={() => onRemoveFromRoster(entry.id)}
                          className="text-text-tertiary hover:text-red-400 transition-colors"
                        >
                          <X size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    );
                  })}
                  {teamRoster.length === 0 && (
                    <p className="text-sm text-text-tertiary italic">Nenhum membro ainda.</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={addMemberId}
                    onChange={(e) => setAddMemberId(e.target.value)}
                    className="bg-card-alt border border-line rounded-card px-2 py-2 text-xs outline-none focus:border-champagne transition-colors cursor-pointer"
                  >
                    <option value="">Pessoa...</option>
                    {availableMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onAddToRoster(team.id, addMemberId, addRole);
                          setAddMemberId("");
                          setAddRole("");
                        }
                      }}
                      placeholder="Função (ex: Líder)"
                      className="flex-1 bg-card-alt border border-line rounded-card px-2 py-2 text-xs outline-none focus:border-champagne transition-colors placeholder:text-text-tertiary"
                    />
                    <button
                      onClick={() => {
                        onAddToRoster(team.id, addMemberId, addRole);
                        setAddMemberId("");
                        setAddRole("");
                      }}
                      disabled={!addMemberId || !addRole.trim()}
                      className="text-champagne hover:opacity-80 disabled:opacity-30 transition-opacity shrink-0"
                    >
                      <Plus size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}