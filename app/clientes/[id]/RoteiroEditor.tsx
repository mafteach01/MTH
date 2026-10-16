"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Save, Paintbrush, X } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

const PERMITIDOS = ["SPAN", "BR", "DIV", "B", "I"];

function escapar(t: string) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function limpar(html: string) {
  const t = document.createElement("template");
  t.innerHTML = html;
  t.content.querySelectorAll("*").forEach((el) => {
    const e = el as HTMLElement;
    if (!PERMITIDOS.includes(e.tagName)) {
      e.replaceWith(...Array.from(e.childNodes));
      return;
    }
    const c = e.style.color;
    Array.from(e.attributes).forEach((a) => e.removeAttribute(a.name));
    if (c) e.style.color = c;
  });
  return t.innerHTML;
}

export function RoteiroEditor({
  itemId,
  valor,
  onSalvar,
}: {
  itemId: string;
  valor: string | null;
  onSalvar: (v: string | null) => void;
}) {
  const [supabase] = useState(() => createClient());
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const ultimo = useRef<string | null>(valor);
  const [cor, setCor] = useState("#c0392b");
  const [salvas, setSalvas] = useState<{ id: string; hex: string }[]>([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const v = valor ?? "";
    el.innerHTML = /<[a-z][\s\S]*>/i.test(v) ? limpar(v) : escapar(v);
    ultimo.current = valor ? limpar(el.innerHTML) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    supabase
      .from("mt_saved_colors")
      .select("id, hex")
      .order("created_at", { ascending: false })
      .then(({ data }) => setSalvas(data ?? []));
  }, [supabase]);

  useEffect(() => {
    function onSel() {
      const s = document.getSelection();
      if (!s || s.rangeCount === 0) return;
      const r = s.getRangeAt(0);
      if (ref.current && ref.current.contains(r.commonAncestorContainer)) {
        range.current = r.cloneRange();
      }
    }
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  function salvar() {
    const el = ref.current;
    if (!el) return;
    const novo = el.textContent?.trim() ? limpar(el.innerHTML) : null;
    if (novo !== ultimo.current) {
      ultimo.current = novo;
      onSalvar(novo);
    }
  }

  function pintar(hex: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const s = window.getSelection();
    if (range.current && s) {
      s.removeAllRanges();
      s.addRange(range.current);
    }
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, hex);
    salvar();
  }

  async function salvarCor() {
    const hex = cor.toLowerCase();
    if (salvas.some((s) => s.hex === hex)) return;
    const { data } = await supabase
      .from("mt_saved_colors")
      .insert({ hex })
      .select("id, hex")
      .single();
    if (data) setSalvas((p) => [data, ...p]);
  }

  async function apagarCor(id: string) {
    await supabase.from("mt_saved_colors").delete().eq("id", id);
    setSalvas((p) => p.filter((s) => s.id !== id));
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {}
  }

  const noFocus = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label className="text-xs text-text-secondary">Roteiro</label>

      <div className="flex flex-wrap items-center gap-2 border border-line rounded-card p-2 bg-card-alt">
        <input
          type="color"
          value={cor}
          onChange={(e) => setCor(e.target.value)}
          className="w-9 h-9 p-0 border-0 rounded cursor-pointer bg-transparent"
          title="Escolher cor"
        />
        <span className="text-xs text-text-secondary uppercase">{cor}</span>

        <button
          onMouseDown={noFocus}
          onClick={() => pintar(cor)}
          className="flex items-center gap-1 text-[11px] text-champagne border border-line rounded-badge px-2 py-1.5"
        >
          <Paintbrush size={12} strokeWidth={1.5} />
          Pintar
        </button>
        <button
          onMouseDown={noFocus}
          onClick={salvarCor}
          className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-champagne border border-line rounded-badge px-2 py-1.5 transition-colors"
        >
          <Save size={12} strokeWidth={1.5} />
          Salvar cor
        </button>
        <button
          onMouseDown={noFocus}
          onClick={copiar}
          className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-champagne border border-line rounded-badge px-2 py-1.5 transition-colors"
        >
          {copiado ? (
            <Check size={12} strokeWidth={1.5} />
          ) : (
            <Copy size={12} strokeWidth={1.5} />
          )}
          {copiado ? "Copiado" : "Copiar código"}
        </button>
        <button
          onMouseDown={noFocus}
          onClick={() => pintar("#111111")}
          className="text-[11px] text-text-tertiary hover:text-text border border-line rounded-badge px-2 py-1.5 transition-colors"
        >
          Cor padrão
        </button>
      </div>

      {salvas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {salvas.map((s) => (
            <div key={s.id} className="relative">
              <button
                onMouseDown={noFocus}
                onClick={() => {
                  setCor(s.hex);
                  pintar(s.hex);
                }}
                className="w-8 h-8 rounded-full border border-line"
                style={{ backgroundColor: s.hex }}
                title={s.hex}
              />
              <button
                onClick={() => apagarCor(s.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-card border border-line flex items-center justify-center text-text-tertiary"
                title="Apagar cor"
              >
                <X size={9} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Escreva o roteiro, ideias, referências..."
        onBlur={salvar}
        onPaste={(e) => {
          e.preventDefault();
          const t = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, t);
        }}
        className="bg-white text-[#111111] rounded-card p-3 text-sm outline-none min-h-[240px] whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400"
      />
    </div>
  );
}