import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { money, propertyTypes, reference, sortImages, statusLabels, transactionTypes, type Property, type PropertyStatus } from "@/lib/properties";
import { parsePropertyForm } from "@/lib/property-form";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Gerenciar imóveis | Área da equipe Marangoni" },
    { name: "description", content: "Cadastro, edição e publicação dos imóveis da Marangoni Despachante Imobiliário." },
    { property: "og:title", content: "Gerenciar imóveis | Marangoni" },
    { property: "og:description", content: "Área restrita da equipe para gerenciar imóveis." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminPage,
});

async function fetchIsAdmin() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (error) throw new Error("Não foi possível verificar sua permissão.");
  return Boolean(data);
}
async function fetchAll() {
  const { data, error } = await supabase.from("properties").select("*, property_images(id,url,position)").order("updated_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os imóveis.");
  return (data as unknown as Property[]).map(sortImages);
}

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin });
  const list = useQuery({ queryKey: ["admin-properties"], queryFn: fetchAll, enabled: role.data === true });
  const [editing, setEditing] = useState<Property | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Property | null>(null);
  const [formError, setFormError] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-properties"] }); qc.invalidateQueries({ queryKey: ["catalog"] }); };

  const save = useMutation({
    mutationFn: async ({ data, id }: { data: FormData; id?: string }) => {
      const { input, images } = parsePropertyForm(data);
      let pid = id;
      if (pid) { const { error } = await supabase.from("properties").update(input).eq("id", pid); if (error) throw new Error("Não foi possível salvar o imóvel."); }
      else { const { data: row, error } = await supabase.from("properties").insert(input).select("id").single(); if (error) throw new Error("Não foi possível criar o imóvel."); pid = row.id; }
      const { error: delErr } = await supabase.from("property_images").delete().eq("property_id", pid);
      if (delErr) throw new Error("Imóvel salvo, mas não foi possível atualizar as fotos.");
      if (images.length) { const { error } = await supabase.from("property_images").insert(images.map((url, position) => ({ property_id: pid!, url, position }))); if (error) throw new Error("Imóvel salvo, mas não foi possível salvar as fotos."); }
    },
    onSuccess: () => { toast.success("Imóvel salvo."); setEditing(null); setFormError(""); refresh(); },
    onError: (e: Error) => setFormError(e.message),
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PropertyStatus }) => { const { error } = await supabase.from("properties").update({ status }).eq("id", id); if (error) throw new Error("Não foi possível alterar a situação."); },
    onSuccess: (_d, v) => { toast.success(v.status === "published" ? "Imóvel publicado no site." : "Imóvel removido do site."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("properties").delete().eq("id", id); if (error) throw new Error("Não foi possível excluir o imóvel."); },
    onSuccess: () => { toast.success("Imóvel excluído."); setToDelete(null); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/" }); }
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setFormError(""); save.mutate({ data: new FormData(e.currentTarget), id: editing && editing !== "new" ? editing.id : undefined }); }

  return <main className="section"><div className="wrap admin-page">
    <div className="admin-top"><Link to="/" className="subtle-link">← Ver o site</Link><Button variant="prototype-link" size="prototype" onClick={signOut}>Sair</Button></div>
    <div className="eyebrow">Área da equipe</div><h2>Gerenciar imóveis</h2>
    {role.isPending ? <p className="admin-list" role="status">Verificando acesso…</p>
    : role.isError ? <p className="form-status" role="alert">{role.error.message}</p>
    : !role.data ? <p className="admin-list" role="alert">Sua conta ainda não tem permissão de administrador. Peça a um administrador para liberar seu acesso.</p>
    : editing ? <PropertyForm key={editing === "new" ? "new" : editing.id} property={editing === "new" ? null : editing} busy={save.isPending} error={formError} onSubmit={submit} onCancel={() => { setEditing(null); setFormError(""); }} />
    : <>
      <Button variant="prototype-gold" size="prototype" onClick={() => setEditing("new")}>+ Novo imóvel</Button>
      {list.isPending ? <p className="admin-list" role="status">Carregando imóveis…</p>
      : list.isError ? <p className="form-status" role="alert">{list.error.message} <Button variant="prototype-link" size="prototype" onClick={() => list.refetch()}>Tentar novamente</Button></p>
      : list.data.length === 0 ? <p className="admin-list" role="status">Nenhum imóvel cadastrado ainda. Clique em “Novo imóvel” para começar.</p>
      : <div className="admin-rows">{list.data.map(p => <article key={p.id} className="admin-row">
          <div><strong>{p.title}</strong><div className="admin-list">{reference(p.id)} · {statusLabels[p.status]} · {transactionTypes.find(t => t.value === p.transaction_type)?.label} · {money(p.price)}{p.featured ? " · Destaque" : ""}</div></div>
          <div className="admin-actions">
            <Button variant="prototype-link" size="prototype" onClick={() => setEditing(p)}>Editar</Button>
            {p.status === "published"
              ? <Button variant="prototype-link" size="prototype" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "draft" })}>Despublicar</Button>
              : <Button variant="prototype-link" size="prototype" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "published" })}>Publicar</Button>}
            <Button variant="prototype-link" size="prototype" onClick={() => setToDelete(p)}>Excluir</Button>
          </div></article>)}</div>}
    </>}
    <AlertDialog open={Boolean(toDelete)} onOpenChange={o => { if (!o) setToDelete(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
          <AlertDialogDescription>“{toDelete?.title}” e todas as suas fotos serão excluídos definitivamente. Isso não pode ser desfeito.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={remove.isPending} onClick={e => { e.preventDefault(); if (toDelete) remove.mutate(toDelete.id); }}>{remove.isPending ? "Excluindo…" : "Excluir"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div></main>;
}

function PropertyForm({ property: p, busy, error, onSubmit, onCancel }: { property: Property | null; busy: boolean; error: string; onSubmit: (e: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const f = (id: string, label: string, el: React.ReactNode, wide = false) => <div className={`demo-field${wide ? " wide" : ""}`}><label htmlFor={id}>{label}</label>{el}</div>;
  return <form className="admin-form" onSubmit={onSubmit} noValidate>
    <h3 className="wide">{p ? "Editar imóvel" : "Novo imóvel"}</h3>
    {f("title", "Título *", <input id="title" name="title" defaultValue={p?.title} required maxLength={160} />, true)}
    {f("description", "Descrição", <textarea id="description" name="description" rows={5} defaultValue={p?.description} />, true)}
    {f("property_type", "Tipo *", <select id="property_type" name="property_type" defaultValue={p?.property_type ?? "casa"}>{propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>)}
    {f("transaction_type", "Finalidade *", <select id="transaction_type" name="transaction_type" defaultValue={p?.transaction_type ?? "venda"}>{transactionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>)}
    {f("price", "Preço (R$) — vazio ou 0 mostra “Consulte o valor”", <input id="price" name="price" type="number" min="0" step="0.01" defaultValue={p?.price || ""} />)}
    {f("area_m2", "Área (m²)", <input id="area_m2" name="area_m2" type="number" min="0" step="0.01" defaultValue={p?.area_m2 ?? ""} />)}
    {f("condominium_fee", "Condomínio (R$, opcional)", <input id="condominium_fee" name="condominium_fee" type="number" min="0" step="0.01" defaultValue={p?.condominium_fee ?? ""} />)}
    {f("iptu", "IPTU (R$, opcional)", <input id="iptu" name="iptu" type="number" min="0" step="0.01" defaultValue={p?.iptu ?? ""} />)}
    {f("bedrooms", "Quartos", <input id="bedrooms" name="bedrooms" type="number" min="0" step="1" defaultValue={p?.bedrooms ?? 0} />)}
    {f("bathrooms", "Banheiros", <input id="bathrooms" name="bathrooms" type="number" min="0" step="1" defaultValue={p?.bathrooms ?? 0} />)}
    {f("parking_spaces", "Vagas de garagem", <input id="parking_spaces" name="parking_spaces" type="number" min="0" step="1" defaultValue={p?.parking_spaces ?? 0} />)}
    {f("neighborhood", "Bairro", <input id="neighborhood" name="neighborhood" defaultValue={p?.neighborhood} />)}
    {f("city", "Cidade", <input id="city" name="city" defaultValue={p?.city ?? "Monte Santo de Minas"} />)}
    {f("state", "Estado (sigla)", <input id="state" name="state" maxLength={2} defaultValue={p?.state ?? "MG"} />)}
    {f("address", "Endereço (opcional)", <input id="address" name="address" defaultValue={p?.address ?? ""} />, true)}
    <label className="admin-check wide"><input type="checkbox" name="show_address" defaultChecked={p?.show_address} /> Mostrar o endereço no site</label>
    {f("cover_image", "Link da foto de capa (https://)", <input id="cover_image" name="cover_image" type="url" defaultValue={p?.cover_image ?? ""} />, true)}
    {f("images", "Outras fotos — um link por linha, na ordem de exibição", <textarea id="images" name="images" rows={4} defaultValue={p?.property_images.map(i => i.url).join("\n")} />, true)}
    {f("status", "Situação", <select id="status" name="status" defaultValue={p?.status ?? "draft"}>{(Object.keys(statusLabels) as PropertyStatus[]).map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>)}
    <label className="admin-check"><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Destaque</label>
    <p className="admin-list wide">Somente imóveis com situação “Publicado” aparecem no site.</p>
    {error && <div className="form-status wide" role="alert">{error}</div>}
    <div className="admin-actions wide"><Button variant="prototype-gold" size="prototype" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button><Button variant="prototype-ghost" size="prototype" type="button" onClick={onCancel}>Cancelar</Button></div>
  </form>;
}
