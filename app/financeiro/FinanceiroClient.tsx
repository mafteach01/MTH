"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Paperclip, Check, Eye, Undo2 } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

type Client = {
  id: string;
  name: string;
  contract_value: string | null;
  due_day: number | null;
};

type Payment = {
  id: string;
  client_id: string;
  mes: string;
  valor: string | null;
  pago: boolean;
  pago_em: string | null;
  comprovante_path: string | null;
};

function paraNumero(texto: string | null) {
  if (!texto) return 0;
  const m = texto.match(/[\d.]+(?:,\d{1,2})?/);
  if (!m) return 0;
  const n = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const nome = new Date(a, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export default function FinanceiroClient({
  mes,
  hoje,
  clients,
  payments: inicial,
}: {
  mes: string;
  hoje: string;
  clients: Client[];
  payments: Payment[];
}) {
  const [supabase] = useState(() => createClient());
  const [payments, setPayments] = useState<Payment[]>(inicial);
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const dataHoje = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const diaHoje = parseInt(dataHoje.slice(8, 10), 10);

  const mapa = new Map(payments.map((p) => [p.client_id, p]));

  function status(c: Client) {
    const p = mapa.get(c.id);
    if (p?.pago) return "pago";
    if (mes < hoje) return "atrasado";
    if (mes === hoje && c.due_day && diaHoje > c.due_day) return "atrasado";
    return "pendente";
  }

  function valorDe(c: Client) {
    const p = mapa.get(c.id);
    return paraNumero(p?.valor ?? c.contract_value);
  }

  const total = clients.reduce((s, c) => s + valorDe(c), 0);
  const recebido = clients.reduce(
    (s, c) => (mapa.get(c.id)?.pago ? s + valorDe(c) : s),
    0
  );
  const falta = total - recebido;

  async function salvar(c: Client, patch: Partial<Payment>) {
    const atual = mapa.get(c.id);
    const { data, error } = await supabase
      .from("mt_client_payments")
      .upsert(
        {
          client_id: c.id,
          mes,
          valor: atual?.valor ?? c.contract_value,
          pago: atual?.pago ?? false,
          pago_em: atual?.pago_em ?? null,
          comprovante_path: atual?.comprovante_path ?? null,
          ...patch,
        },
        { onConflict: "client_id,mes" }
      )
      .select()
      .single();
    if (error || !data) {
      setErro(error?.message ?? "Erro ao salvar");
      return false;
    }
    setPayments((prev) => [
      ...prev.filter((p) => p.client_id !== c.id),
      data as Payment,
    ]);
    return true;
  }

  async function alternarPago(c: Client) {
    setErro("");
    setBusy(c.id);
    const p = mapa.get(c.id);
    if (p?.pago) {
      await salvar(c, { pago: false, pago_em: null });
    } else {
      await salvar(c, { pago: true, pago_em: dataHoje });
    }
    setBusy(null);
  }

  async function anexar(c: Client, file: File) {
    setErro("");
    setBusy(c.id);
    const limpo = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${c.id}/${mes}-${Date.now()}-${limpo}`;
    const { error } = await supabase.storage
      .from("mt-comprovantes")
      .upload(path, file);
    if (error) {
      setErro(error.message);
      setBusy(null);
      return;
    }
    const p = mapa.get(c.id);
    await salvar(c, {
      comprovante_path: path,
      pago: true,
      pago_em: p?.pago_em ?? dataHoje,
    });
    setBusy(null);
  }

  async function verComprovante(path: string) {
    setErro("");
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage
      .from("mt-comprovantes")
      .createSignedUrl(path, 120);
    if (error || !data) {
      w?.close();
      setErro(error?.message ?? "Não consegui abrir o comprovante");
      return;
    }
    if (w) w.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  const badge = {
    pago: "border-champagne text-champagne",
    pendente: "border-line text-text-secondary",
    atrasado: "border-red-400/60 text-red-300",
  } as const;
  const rotulo = { pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" } as const;

  return (
    <div className="p-4 md:p-10 min-w-0 max-w-4xl">
      <h1 className="text-xl text-text mb-1">Financeiro</h1>

      <div className="flex items-center justify-between gap-2 my-4">
        <Link
          href={`/financeiro?mes=${moverMes(mes, -1)}`}
          className="w-10 h-10 flex items-center justify-center rounded-card border border-line bg-card text-text-secondary"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Link>
        <span className="text-sm text-text">{nomeMes(mes)}</span>
        <Link
          href={`/financeiro?mes=${moverMes(mes, 1)}`}
          className="w-10 h-10 flex items-center justify-center rounded-card border border-line bg-card text-text-secondary"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-line rounded-card p-4 min-w-0">
          <p className="text-xs text-text-tertiary">Total do mês</p>
          <p className="text-lg text-text break-words">{brl(total)}</p>
        </div>
        <div className="bg-card border border-line rounded-card p-4 min-w-0">
          <p className="text-xs text-text-tertiary">Recebido</p>
          <p className="text-lg text-champagne break-words">{brl(recebido)}</p>
        </div>
        <div className="bg-card border border-line rounded-card p-4 min-w-0">
          <p className="text-xs text-text-tertiary">Falta receber</p>
          <p className="text-lg text-text break-words">{brl(falta)}</p>
        </div>
      </div>

      {erro && <p className="text-sm text-red-300 mb-4 break-words">{erro}</p>}

      {clients.length === 0 && (
        <p className="text-sm text-text-tertiary">Nenhum cliente cadastrado.</p>
      )}

      <div className="flex flex-col gap-3">
        {clients.map((c) => {
          const st = status(c);
          const p = mapa.get(c.id);
          const ocupado = busy === c.id;
          return (
            <div
              key={c.id}
              className="bg-card border border-line rounded-card p-4 min-w-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-text break-words">{c.name}</p>
                  <p className="text-xs text-text-tertiary break-words">
                    {brl(valorDe(c))}
                    {c.due_day ? ` · vence dia ${c.due_day}` : ""}
                  </p>
                  {p?.pago && p.pago_em && (
                    <p className="text-xs text-text-tertiary">
                      Pago em {p.pago_em.split("-").reverse().join("/")}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-1 border rounded-badge ${badge[st]}`}
                >
                  {rotulo[st]}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => alternarPago(c)}
                  disabled={ocupado}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-card border border-line text-text-secondary hover:text-champagne disabled:opacity-50"
                >
                  {p?.pago ? (
                    <Undo2 size={14} strokeWidth={1.5} />
                  ) : (
                    <Check size={14} strokeWidth={1.5} />
                  )}
                  {p?.pago ? "Desmarcar" : "Marcar pago"}
                </button>

                <label
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-card border border-line text-text-secondary hover:text-champagne cursor-pointer ${
                    ocupado ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Paperclip size={14} strokeWidth={1.5} />
                  {p?.comprovante_path ? "Trocar comprovante" : "Anexar comprovante"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) anexar(c, f);
                      e.target.value = "";
                    }}
                  />
                </label>

                {p?.comprovante_path && (
                  <button
                    onClick={() => verComprovante(p.comprovante_path as string)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-card border border-line text-champagne"
                  >
                    <Eye size={14} strokeWidth={1.5} />
                    Ver comprovante
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}