import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PropertyType = Database["public"]["Enums"]["property_type"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

export type PropertyImageRow = { id: string; url: string; position: number; storage_path?: string | null };
export type Property = {
  id: string; title: string; description: string;
  property_type: PropertyType; transaction_type: TransactionType;
  price: number; condominium_fee: number | null; iptu: number | null;
  bedrooms: number; bathrooms: number; parking_spaces: number; area_m2: number | null; land_area_m2: number | null; built_area_m2: number | null;
  address?: string | null; show_address: boolean; public_address: string | null;
  neighborhood: string; city: string; state: string; cover_image: string | null;
  status: PropertyStatus; featured: boolean; created_at: string; updated_at: string;
  property_images: PropertyImageRow[];
};

export const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "casa", label: "Casa" }, { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" }, { value: "comercial", label: "Comercial" }, { value: "rural", label: "Rural" },
];
export const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: "venda", label: "Venda" }, { value: "aluguel", label: "Aluguel" },
];
export const statusLabels: Record<PropertyStatus, string> = {
  draft: "Rascunho", published: "Publicado", sold: "Vendido", rented: "Alugado",
};
export const typeLabel = (t: PropertyType) => propertyTypes.find(x => x.value === t)?.label ?? t;

export type Filters = { purpose: "all" | TransactionType; type: "all" | PropertyType; maxprice: string; search: string };
export const defaultFilters: Filters = { purpose: "all", type: "all", maxprice: "all", search: "" };

export const PUBLIC_COLUMNS = "id,title,description,property_type,transaction_type,price,condominium_fee,iptu,bedrooms,bathrooms,parking_spaces,area_m2,land_area_m2,built_area_m2,show_address,public_address,neighborhood,city,state,cover_image,status,featured,created_at,updated_at,property_images(id,url,position,storage_path)";
export const PHOTO_BUCKET = "property-photos";

/** Removes characters that would break a PostgREST `or` filter; keeps letters, numbers and spaces. */
export function sanitizeSearch(value: string) {
  return value.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export type FeatureSearch = { text: string; bedrooms: number | null; bathrooms: number | null; parking: number | null; parkingAny: boolean };
const FEATURE_TERMS: [RegExp, "bedrooms" | "bathrooms" | "parking"][] = [
  [/^quartos?$/, "bedrooms"],
  [/^banheiros?$/, "bathrooms"],
  [/^(vagas?|garagens?|garagem)$/, "parking"],
];
/**
 * Splits the search box into feature filters and remaining free text.
 * "quarto 3" → bedrooms=3; "garagem" without a number → at least 1 parking space.
 * Case-insensitive and accent-insensitive; unmatched words stay as free text.
 */
export function parseSearch(value: string): FeatureSearch {
  const tokens = value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
  const out: FeatureSearch = { text: "", bedrooms: null, bathrooms: null, parking: null, parkingAny: false };
  const rest: string[] = [];
  for (let t = 0; t < tokens.length; t++) {
    const term = FEATURE_TERMS.find(([re]) => re.test(tokens[t]!));
    const next = tokens[t + 1];
    if (term && next && /^\d+$/.test(next)) {
      const n = Number(next);
      if (term[1] === "bedrooms") out.bedrooms = n;
      else if (term[1] === "bathrooms") out.bathrooms = n;
      else { out.parking = n; out.parkingAny = false; }
      t++;
    } else if (term && term[1] === "parking") {
      if (out.parking === null) out.parkingAny = true;
    } else rest.push(tokens[t]!);
  }
  out.text = rest.join(" ");
  return out;
}

export function sortImages(p: Property): Property {
  return { ...p, property_images: [...(p.property_images ?? [])].sort((a, b) => a.position - b.position) };
}

/** Public catalog: only published listings, filtered in the database. */
export async function fetchPublishedProperties(client: SupabaseClient<Database>, filters: Filters) {
  let q = client.from("properties").select(PUBLIC_COLUMNS).eq("status", "published");
  if (filters.purpose !== "all") q = q.eq("transaction_type", filters.purpose);
  if (filters.type !== "all") q = q.eq("property_type", filters.type);
  if (filters.maxprice !== "all") q = q.gt("price", 0).lte("price", Number(filters.maxprice));
  const f = parseSearch(filters.search);
  if (f.bedrooms !== null) q = q.eq("bedrooms", f.bedrooms);
  if (f.bathrooms !== null) q = q.eq("bathrooms", f.bathrooms);
  if (f.parking !== null) q = q.eq("parking_spaces", f.parking);
  else if (f.parkingAny) q = q.gte("parking_spaces", 1);
  const s = sanitizeSearch(f.text);
  if (s) q = q.or(`title.ilike.%${s}%,neighborhood.ilike.%${s}%,city.ilike.%${s}%,description.ilike.%${s}%`);
  const { data, error } = await q.order("featured", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os imóveis. Tente novamente em instantes.");
  return resolvePhotos(client, (data as unknown as Property[]).map(sortImages));
}

export async function fetchPublishedProperty(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client.from("properties").select(PUBLIC_COLUMNS).eq("status", "published").eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o imóvel.");
  return data ? (await resolvePhotos(client, [sortImages(data as unknown as Property)]))[0] ?? null : null;
}

export function propertyFeatures(p: Pick<Property, "bedrooms" | "bathrooms" | "parking_spaces" | "area_m2" | "land_area_m2" | "built_area_m2">) {
  const f: string[] = [];
  if (p.bedrooms) f.push(`${p.bedrooms} ${p.bedrooms === 1 ? "quarto" : "quartos"}`);
  if (p.bathrooms) f.push(`${p.bathrooms} ${p.bathrooms === 1 ? "banheiro" : "banheiros"}`);
  if (p.parking_spaces) f.push(`${p.parking_spaces} ${p.parking_spaces === 1 ? "vaga" : "vagas"}`);
  const m = (n: number) => `${Number(n).toLocaleString("pt-BR")} m²`;
  if (p.land_area_m2) f.push(`Terreno ${m(p.land_area_m2)}`);
  if (p.built_area_m2) f.push(`Construção ${m(p.built_area_m2)}`);
  if (!p.land_area_m2 && !p.built_area_m2 && p.area_m2) f.push(m(p.area_m2));
  return f;
}
export function propertyLocation(p: Pick<Property, "public_address" | "neighborhood" | "city" | "state">) {
  return [p.public_address, p.neighborhood, [p.city, p.state].filter(Boolean).join(" - ")].filter(Boolean).join(" · ");
}
export function propertyGallery(p: Pick<Property, "cover_image" | "property_images">) {
  const urls = p.property_images.map(i => i.url);
  return p.cover_image && !urls.includes(p.cover_image) ? [p.cover_image, ...urls] : urls;
}
export const reference = (id: string) => id.slice(0, 8).toUpperCase();
export function money(n: number | null | undefined) {
  return n && n > 0 ? Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "Consulte o valor";
}
export function safeImageUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:" ? url.href : null } catch { return null } }

const isUrl = (v: string) => /^https:\/\//.test(v);
/** Turns stored photo paths (private bucket) into temporary signed links; full https links pass through. */
export async function resolvePhotos(client: SupabaseClient<Database>, list: Property[]): Promise<Property[]> {
  const paths = [...new Set(list.flatMap(p => [p.cover_image, ...p.property_images.map(i => i.url)]).filter((v): v is string => Boolean(v) && !isUrl(v!)))];
  if (!paths.length) return list;
  const { data } = await client.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60 * 6);
  const map = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  const r = (v: string | null) => (v && !isUrl(v) ? map.get(v) ?? null : v);
  return list.map(p => ({ ...p, cover_image: r(p.cover_image), property_images: p.property_images.map(i => ({ ...i, url: r(i.url) ?? "" })).filter(i => i.url) }));
}

export const MAX_FEATURED = 10;
/** Featured published listings for the home carousel (max 10). */
export async function fetchFeaturedProperties(client: SupabaseClient<Database>) {
  const { data, error } = await client.from("properties").select(PUBLIC_COLUMNS).eq("status", "published").eq("featured", true).order("updated_at", { ascending: false }).limit(MAX_FEATURED);
  if (error) throw new Error("Não foi possível carregar os destaques.");
  return resolvePhotos(client, (data as unknown as Property[]).map(sortImages));
}
