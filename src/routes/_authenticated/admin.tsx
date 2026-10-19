import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { money, PHOTO_BUCKET, propertyTypes, reference, resolvePhotos, sortImages, statusLabels, transactionTypes, type Property, type PropertyStatus } from "@/lib/properties";
import { movePhoto, parsePropertyForm, pickCover, type Photo } from "@/lib/property-form";

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

type AdminProperty = Property & { photos: Photo[]; coverKey: string | null };
const MAX_MB = 10;

async function fetchIsAdmin() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (error) throw new Error("Não foi possível verificar sua permissão.");
  return Boolean(data);
}
async function fetchAll(): Promise<AdminProperty[]> {
  const { data, error } = await supabase.from("properties").select("*, property_images(id,url,position,storage_path)").order("updated_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os imóveis.");
  const raw = (data as unknown as Property[]).map(sortImages);
  const resolved = await resolvePhotos(supabase, raw.map(p => ({ ...p, property_images: [...p.property_images] })));
  return raw.map((p, i) => {
    const urls = new Map(resolved[i]!.property_images.map(x => [x.id, x.url]));
    return { ...p, coverKey: p.cover_image, photos: p.property_images.map(img => ({ path: img.storage_path ?? null, url: urls.get(img.id) ?? img.url })) };
  });
}

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin });
  const list = useQuery({ queryKey: ["admin-properties"], queryFn: fetchAll, enabled: role.data === true });
  const [editing, setEditing] = useState<AdminProperty | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminProperty | null>(null);
  const [formError, setFormError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-properties"] }); qc.invalidateQueries({ queryKey: ["catalog"] }); };
  const shown = useMemo(() => (list.data ?? []).filter(p => (statusFilter === "all" || p.status === statusFilter) && p.title.toLocaleLowerCase("pt-BR").includes(q.trim().toLocaleLowerCase("pt-BR"))), [list.data, q, statusFilter]);

  const save = useMutation({
    mutationFn: async ({ data, id, photos, cover, removed }: { data: FormData; id: string | undefined; photos: Photo[]; cover: string | null; removed: string[] }) => {
      const { input } = parsePropertyForm(data);
      const row = { ...input, cover_image: pickCover(photos, cover) };
      let pid = id;
      if (pid) { const { error } = await supabase.from("properties").update(row).eq("id", pid); if (error) throw new Error("Não foi possível salvar o imóvel. Verifique sua permissão e tente novamente."); }
      else { const { data: r, error } = await supabase.from("properties").insert(row).select("id").single(); if (error) throw new Error("Não foi possível criar o imóvel. Verifique sua permissão e tente novamente."); pid = r.id; }
      const { error: delErr } = await supabase.from("property_images").delete().eq("property_id", pid);
      if (delErr) throw new Error("Imóvel salvo, mas não foi possível atualizar as fotos.");
      if (photos.length) {
        const { error } = await supabase.from("property_images").insert(photos.map((p, position) => ({ property_id: pid!, url: p.path ?? p.url, storage_path: p.path, position })));
        if (error) throw new Error("Imóvel salvo, mas não foi possível salvar as fotos.");
      }
      if (removed.length) await supabase.storage.from(PHOTO_BUCKET).remove(removed);
      return input.status;
    },
    onSuccess: (status) => { toast.success(status === "published" ? "Imóvel salvo e publicado no site." : `Imóvel salvo como “${statusLabels[status]}”.`); setEditing(null); setFormError(""); refresh(); },
    onError: (e: Error) => { setFormError(e.message); toast.error(e.message); },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PropertyStatus }) => { const { error } = await supabase.from("properties").update({ status }).eq("id", id); if (error) throw new Error("Não foi possível alterar a situação."); return status; },
    onSuccess: (s) => { toast.success({ published: "Imóvel publicado no site.", draft: "Imóvel retirado do site (rascunho).", sold: "Imóvel marcado como vendido e retirado do site.", rented: "Imóvel marcado como alugado e retirado do site." }[s]); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (p: AdminProperty) => {
      const { error } = await supabase.from("properties").delete().eq("id", p.id);
      if (error) throw new Error("Não foi possível excluir o imóvel.");
      const paths = p.photos.map(x => x.path).filter((x): x is string => Boolean(x));
      if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    },
    onSuccess: () => { toast.success("Imóvel excluído."); setToDelete(null); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return <main className="section"><div className="wrap admin-page">
    <div className="admin-top">
      <Button asChild variant="prototype-ghost" size="prototype"><a href="/" target="_blank" rel="noopener noreferrer">Abrir site público ↗</a></Button>
      <Button variant="prototype-link" size="prototype" onClick={signOut}>Sair da conta</Button>
    </div>
    <div className="eyebrow">Área da equipe</div><h2>Gerenciar imóveis</h2>
    {role.isPending ? <p className="admin-list" role="status">Verificando acesso…</p>
    : role.isError ? <p className="form-status" role="alert">{role.error.message}</p>
    : !role.data ? <p className="admin-list" role="alert">Sua conta não tem permissão de administrador. Peça à administração da Marangoni para liberar seu acesso.</p>
    : editing ? <PropertyForm key={editing === "new" ? "new" : editing.id} property={editing === "new" ? null : editing} busy={save.isPending} error={formError}
        onSave={(data, photos, cover, removed) => { setFormError(""); save.mutate({ data, id: editing === "new" ? undefined : editing.id, photos, cover, removed }); }}
        onCancel={() => { setEditing(null); setFormError(""); }} />
    : <>
      <div className="admin-toolbar">
        <div className="demo-field"><label htmlFor="admin-q">Buscar por título</label><input id="admin-q" value={q} onChange={e => setQ(e.target.value)} placeholder="Ex.: casa" /></div>
        <div className="demo-field"><label htmlFor="admin-status">Situação</label><select id="admin-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}><option value="all">Todas</option>{(Object.keys(statusLabels) as PropertyStatus[]).map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></div>
        <Button variant="prototype-gold" size="prototype" onClick={() => setEditing("new")}>+ Novo imóvel</Button>
      </div>
      {list.isPending ? <p className="admin-list" role="status">Carregando imóveis…</p>
      : list.isError ? <p className="form-status" role="alert">{list.error.message} <Button variant="prototype-link" size="prototype" onClick={() => list.refetch()}>Tentar novamente</Button></p>
      : list.data.length === 0 ? <p className="admin-list" role="status">Nenhum imóvel cadastrado ainda. Clique em “Novo imóvel” para começar.</p>
      : shown.length === 0 ? <p className="admin-list" role="status">Nenhum imóvel corresponde à busca.</p>
      : <div className="admin-rows">{shown.map(p => <article key={p.id} className="admin-row">
          <div className="admin-row-main">
            {p.photos[0] ? <img className="admin-thumb" src={p.photos.find(x => (x.path ?? x.url) === p.coverKey)?.url ?? p.photos[0].url} alt="" /> : <div className="admin-thumb empty-thumb">Sem foto</div>}
            <div><strong>{p.title}</strong><div className="admin-list"><span className={`status-pill s-${p.status}`}>{statusLabels[p.status]}</span> {reference(p.id)} · {transactionTypes.find(t => t.value === p.transaction_type)?.label} · {money(p.price)} · {p.photos.length} foto(s){p.featured ? " · Destaque" : ""}</div></div>
          </div>
          <div className="admin-actions">
            <Button variant="prototype-link" size="prototype" onClick={() => setEditing(p)}>Editar</Button>
            {p.status === "published"
              ? <Button variant="prototype-link" size="prototype" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "draft" })}>Despublicar</Button>
              : <Button variant="prototype-link" size="prototype" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "published" })}>Publicar</Button>}
            {p.status !== "sold" && p.transaction_type === "venda" && <Button variant="prototype-link" size="prototype" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "sold" })}>Marcar vendido</Button>}
            {p.status !== "rented" && p.transaction_type === "aluguel" && <Button variant="prototype-link" size="prototype" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "rented" })}>Marcar alugado</Button>}
            <Button variant="prototype-link" size="prototype" onClick={() => setToDelete(p)}>Excluir</Button>
          </div></article>)}</div>}
    </>}
    <AlertDialog open={Boolean(toDelete)} onOpenChange={o => { if (!o) setToDelete(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
          <AlertDialogDescription>“{toDelete?.title}” e todas as suas fotos serão excluídos definitivamente. Isso não pode ser desfeito.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={remove.isPending} onClick={e => { e.preventDefault(); if (toDelete) remove.mutate(toDelete); }}>{remove.isPending ? "Excluindo…" : "Excluir"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div></main>;
}

function PropertyForm({ property: p, busy, error, onSave, onCancel }: { property: AdminProperty | null; busy: boolean; error: string; onSave: (d: FormData, photos: Photo[], cover: string | null, removed: string[]) => void; onCancel: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>(p?.photos ?? []);
  const [cover, setCover] = useState<string | null>(p?.coverKey ?? null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const key = (x: Photo) => x.path ?? x.url;
  const coverKey = pickCover(photos, cover);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: Photo[] = []; let failed = 0;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name}: envie apenas imagens.`); failed++; continue; }
      if (file.size > MAX_MB * 1024 * 1024) { toast.error(`${file.name}: a foto deve ter até ${MAX_MB} MB.`); failed++; continue; }
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: e } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type });
      if (e) { failed++; continue; }
      const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60 * 6);
      added.push({ path, url: data?.signedUrl ?? "" });
    }
    setPhotos(cur => [...cur, ...added]); setUploading(false);
    if (added.length) toast.success(`${added.length} foto(s) enviada(s). Clique em “Salvar” para confirmar.`);
    if (failed && !added.length) toast.error("Não foi possível enviar as fotos.");
  }
  function removePhoto(i: number) {
    const ph = photos[i]; if (!ph) return;
    if (ph.path) setRemoved(r => [...r, ph.path!]);
    setPhotos(photos.filter((_, j) => j !== i));
  }
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); onSave(new FormData(e.currentTarget), photos, coverKey, removed); }

  const f = (id: string, label: string, el: React.ReactNode, wide = false) => <div className={`demo-field${wide ? " wide" : ""}`}><label htmlFor={id}>{label}</label>{el}</div>;
  return <form className="admin-form" onSubmit={submit} noValidate>
    <h3 className="wide">{p ? "Editar imóvel" : "Novo imóvel"}</h3>
    {f("title", "Título *", <input id="title" name="title" defaultValue={p?.title} required maxLength={160} />, true)}
    {f("description", "Descrição", <textarea id="description" name="description" rows={5} defaultValue={p?.description} />, true)}
    {f("property_type", "Tipo *", <select id="property_type" name="property_type" defaultValue={p?.property_type ?? "casa"}>{propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>)}
    {f("transaction_type", "Finalidade *", <select id="transaction_type" name="transaction_type" defaultValue={p?.transaction_type ?? "venda"}>{transactionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>)}
    {f("price", "Preço (R$) — vazio mostra “Consulte o valor”", <input id="price" name="price" type="number" min="0" step="0.01" defaultValue={p?.price || ""} />)}
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

    <div className="wide photo-manager">
      <div className="demo-field"><label htmlFor="photos">Fotos (JPG, PNG ou WEBP, até {MAX_MB} MB cada — pode selecionar várias)</label>
        <input id="photos" type="file" accept="image/*" multiple disabled={uploading} onChange={e => { upload(e.target.files); e.target.value = ""; }} /></div>
      {uploading && <p className="admin-list" role="status">Enviando fotos…</p>}
      {photos.length === 0 ? <p className="admin-list">Nenhuma foto ainda.</p> :
        <ol className="photo-list">{photos.map((ph, i) => <li key={key(ph)} className={key(ph) === coverKey ? "is-cover" : ""}>
          <img src={ph.url} alt={`Foto ${i + 1}`} />
          {key(ph) === coverKey && <span className="cover-badge">Capa</span>}
          <div className="photo-tools">
            <button type="button" onClick={() => setPhotos(movePhoto(photos, i, -1))} disabled={i === 0} aria-label={`Mover foto ${i + 1} para trás`}>←</button>
            <button type="button" onClick={() => setPhotos(movePhoto(photos, i, 1))} disabled={i === photos.length - 1} aria-label={`Mover foto ${i + 1} para frente`}>→</button>
            {key(ph) !== coverKey && <button type="button" onClick={() => setCover(key(ph))}>Usar como capa</button>}
            <button type="button" onClick={() => removePhoto(i)} aria-label={`Remover foto ${i + 1}`}>Remover</button>
          </div></li>)}</ol>}
    </div>

    {f("status", "Situação", <select id="status" name="status" defaultValue={p?.status ?? "draft"}>{(Object.keys(statusLabels) as PropertyStatus[]).map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>)}
    <label className="admin-check"><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Destaque</label>
    <p className="admin-list wide">Novos imóveis começam como “Rascunho”. Somente imóveis “Publicado” aparecem no site; vendidos e alugados saem do site automaticamente.</p>
    {error && <div className="form-status wide" role="alert">{error}</div>}
    <div className="admin-actions wide"><Button variant="prototype-gold" size="prototype" type="submit" disabled={busy || uploading}>{busy ? "Salvando…" : "Salvar"}</Button><Button variant="prototype-ghost" size="prototype" type="button" onClick={onCancel}>Cancelar</Button></div>
  </form>;
}
