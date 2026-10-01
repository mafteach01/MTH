type BadgeTone = "success" | "champagne" | "neutral";

const toneByLabel: Record<string, BadgeTone> = {
  Publicado: "champagne",
  Concluída: "success",
  Ativo: "success",
  "Em produção": "champagne",
  "Em planejamento": "neutral",
  "Em revisão": "neutral",
};

const toneStyles: Record<BadgeTone, string> = {
  success: "text-success border-success/30",
  champagne: "text-champagne border-champagne/30",
  neutral: "text-text-secondary border-line-strong",
};

export function Badge({ label }: { label: string }) {
  const tone = toneByLabel[label] ?? "neutral";
  return (
    <span className={`text-xs border rounded-badge px-3 py-1 shrink-0 ${toneStyles[tone]}`}>
      {label}
    </span>
  );
}