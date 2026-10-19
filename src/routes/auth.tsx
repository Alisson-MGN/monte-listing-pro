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
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true); setStatus("");
    const { error } = await supabase.auth.signInWithPassword({ email: String(d.get("email") ?? "").trim(), password: String(d.get("password") ?? "") });
    setBusy(false);
    if (error) { setStatus("E-mail ou senha incorretos."); return; }
    navigate({ to: "/admin" });
  }
  return <main className="section"><div className="wrap admin-page" style={{ maxWidth: 460 }}>
    <Link to="/" className="subtle-link">← Voltar ao site</Link>
    <div className="eyebrow" style={{ marginTop: 24 }}>Área da equipe</div>
    <h2>Entrar</h2>
    <form className="admin-form single" onSubmit={submit}>
      <div className="demo-field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="demo-field"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <Button variant="prototype-gold" size="prototype" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
    </form>
    <div className="form-status" role="alert">{status}</div>
    <p className="admin-list">Acesso exclusivo para a equipe autorizada. Não há cadastro público: novas contas são criadas pela administração.</p>
  </div></main>;
}
