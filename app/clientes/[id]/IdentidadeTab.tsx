"use client";

import { IdentidadeBriefing } from "./IdentidadeBriefing";

export type BrandRow = {
  colors: string[] | null;
  fonts: string | null;
  logo_url: string | null;
  tone_of_voice: string | null;
};

export function IdentidadeTab({
  clientId,
  initial,
}: {
  clientId: string;
  initial: BrandRow | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <IdentidadeBriefing clientId={clientId} initial={initial} />
    </div>
  );
}