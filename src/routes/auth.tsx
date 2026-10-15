import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Entrar | Área da equipe Marangoni" },
    { name: "description", content: "Acesso restrito à equipe da Marangoni Despachante Imobiliário para gerenciar imóveis." },
    { property: "og:title", content: "Área da equipe Marangoni" },
    { property: "og:description", content: "Acesso restrito para gerenciar os imóveis do site." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const email = String(d.get("email") ?? "").trim(); const password = String(d.get("password") ?? "");
    setBusy(true); setStatus("");
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
        navigate({ to: "/admin" });
      } else {
        if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) throw new Error(error.message);
        if (data.session) navigate({ to: "/admin" });
        else setStatus("Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.");
      }
    } catch (err) { setStatus(err instanceof Error ? err.message : "Algo deu errado. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <main className="section"><div className="wrap admin-page" style={{ maxWidth: 460 }}>
    <Link to="/" className="subtle-link">← Voltar ao site</Link>
    <div className="eyebrow" style={{ marginTop: 24 }}>Área da equipe</div>
    <h2>{mode === "in" ? "Entrar" : "Criar acesso"}</h2>
    <form className="admin-form single" onSubmit={submit}>
      <div className="demo-field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="demo-field"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={mode === "up" ? 8 : undefined} /></div>
      <Button variant="prototype-gold" size="prototype" type="submit" disabled={busy}>{busy ? "Aguarde…" : mode === "in" ? "Entrar" : "Criar acesso"}</Button>
    </form>
    <div className="form-status" role="status">{status}</div>
    <Button variant="prototype-link" size="prototype" onClick={() => { setMode(mode === "in" ? "up" : "in"); setStatus(""); }}>{mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}</Button>
    <p className="admin-list">Somente contas autorizadas como administradoras podem cadastrar e editar imóveis.</p>
  </div></main>;
}
