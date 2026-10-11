"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Building2, Ticket } from "lucide-react";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Se o link tiver ?convite=CODIGO, abre direto no cadastro com o código preenchido
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("convite");
    if (code) {
      setInviteCode(code);
      setMode("signup");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg("E-mail ou senha incorretos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const code = inviteCode.trim();

    if (code) {
      const { data: invitedOrg } = await supabase.rpc("mt_check_invite", { code });
      if (!invitedOrg) {
        setLoading(false);
        setErrorMsg("Código de convite inválido ou expirado.");
        return;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          agency_name: code ? null : orgName,
          invite_code: code || null,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(
        error.message.includes("already registered")
          ? "Já existe uma conta com esse e-mail."
          : "Não foi possível criar a conta. Tente novamente."
      );
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setInfoMsg("Conta criada! Verifique seu e-mail para confirmar o acesso.");
    setMode("login");
  }

  const isSignup = mode === "signup";
  const hasInvite = inviteCode.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-card-alt border border-line flex items-center justify-center text-champagne font-medium">
            MT
          </div>
          <h1 className="text-xl font-medium mt-2">Mafteach</h1>
          <p className="text-xs text-text-tertiary text-center">
            Sua marca. Novas portas. Mais oportunidades.
          </p>
        </div>

        <form
          onSubmit={isSignup ? handleSignup : handleLogin}
          className="border border-line rounded-card bg-card p-6 flex flex-col gap-4"
        >
          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Nome</label>
              <div className="flex items-center gap-2 border border-line rounded-card px-3 py-2.5 focus-within:border-champagne transition-colors">
                <User size={15} className="text-text-tertiary" strokeWidth={1.5} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}

          {isSignup && !hasInvite && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Nome da agência ou projeto</label>
              <div className="flex items-center gap-2 border border-line rounded-card px-3 py-2.5 focus-within:border-champagne transition-colors">
                <Building2 size={15} className="text-text-tertiary" strokeWidth={1.5} />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex: Minha Agência"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">E-mail</label>
            <div className="flex items-center gap-2 border border-line rounded-card px-3 py-2.5 focus-within:border-champagne transition-colors">
              <Mail size={15} className="text-text-tertiary" strokeWidth={1.5} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="bg-transparent outline-none text-sm w-full placeholder:text-text-tertiary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-secondary">Senha</label>
            <div className="flex items-center gap-2 border border-line rounded-card px-3 py-2.5 focus-within:border-champagne transition-colors">
              <Lock size={15} className="text-text-tertiary" strokeWidth={1.5} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none text-sm w-full placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Código de convite (opcional)</label>
              <div className="flex items-center gap-2 border border-line rounded-card px-3 py-2.5 focus-within:border-champagne transition-colors">
                <Ticket size={15} className="text-text-tertiary" strokeWidth={1.5} />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Só se alguém te convidou"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}

          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
          {infoMsg && <p className="text-xs text-champagne">{infoMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-champagne text-black text-sm font-medium py-2.5 rounded-card hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading
              ? isSignup
                ? "Criando conta..."
                : "Entrando..."
              : isSignup
              ? "Criar conta"
              : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "login" : "signup");
            setErrorMsg(null);
            setInfoMsg(null);
          }}
          className="text-xs text-text-tertiary text-center hover:text-text-secondary transition-colors cursor-pointer"
        >
          {isSignup ? "Já tem conta? Entrar" : "Novo por aqui? Criar conta"}
        </button>
      </div>
    </div>
  );
}