import { type PropertyStatus, type PropertyType, type TransactionType } from "./properties";

export type PropertyInput = {
  title: string; description: string; property_type: PropertyType; transaction_type: TransactionType;
  price: number; condominium_fee: number | null; iptu: number | null;
  bedrooms: number; bathrooms: number; parking_spaces: number; area_m2: number | null; land_area_m2: number | null; built_area_m2: number | null;
  address: string | null; show_address: boolean; neighborhood: string; city: string; state: string;
  cover_image: string | null; status: PropertyStatus; featured: boolean;
};

const TYPES = ["casa", "apartamento", "terreno", "comercial", "rural"];
const STATUS = ["draft", "published", "sold", "rented"];

function num(v: FormDataEntryValue | null, label: string, opts: { optional?: boolean; int?: boolean } = {}) {
  const raw = String(v ?? "").trim().replace(",", ".");
  if (!raw) { if (opts.optional) return null; return 0; }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label}: informe um número igual ou maior que zero.`);
  if (opts.int && !Number.isInteger(n)) throw new Error(`${label}: informe um número inteiro.`);
  return n;
}

/** Validates the admin form. Throws a Portuguese message on the first invalid field. */
export function parsePropertyForm(data: FormData): { input: Omit<PropertyInput, "cover_image"> } {
  const title = String(data.get("title") ?? "").trim();
  if (!title) throw new Error("Informe o título do imóvel.");
  if (title.length > 160) throw new Error("O título deve ter até 160 caracteres.");
  const property_type = String(data.get("property_type"));
  if (!TYPES.includes(property_type)) throw new Error("Escolha o tipo do imóvel.");
  const transaction_type = String(data.get("transaction_type"));
  if (transaction_type !== "venda" && transaction_type !== "aluguel") throw new Error("Escolha venda ou aluguel.");
  const status = String(data.get("status") ?? "draft");
  if (!STATUS.includes(status)) throw new Error("Situação inválida.");
  const state = String(data.get("state") ?? "").trim().toUpperCase();
  if (state && !/^[A-Z]{2}$/.test(state)) throw new Error("Estado: use a sigla com 2 letras, ex.: MG.");
  const address = String(data.get("address") ?? "").trim() || null;
  return {
    input: {
      title, description: String(data.get("description") ?? "").trim(),
      property_type: property_type as PropertyType, transaction_type: transaction_type as TransactionType,
      price: num(data.get("price"), "Preço") ?? 0,
      condominium_fee: num(data.get("condominium_fee"), "Condomínio", { optional: true }),
      iptu: num(data.get("iptu"), "IPTU", { optional: true }),
      bedrooms: num(data.get("bedrooms"), "Quartos", { int: true }) ?? 0,
      bathrooms: num(data.get("bathrooms"), "Banheiros", { int: true }) ?? 0,
      parking_spaces: num(data.get("parking_spaces"), "Vagas", { int: true }) ?? 0,
      land_area_m2: num(data.get("land_area_m2"), "Área do terreno", { optional: true }),
      built_area_m2: num(data.get("built_area_m2"), "Área da construção", { optional: true }),
      address, show_address: Boolean(address) && data.get("show_address") === "on",
      neighborhood: String(data.get("neighborhood") ?? "").trim(),
      city: String(data.get("city") ?? "").trim() || "Monte Santo de Minas",
      state: state || "MG", status: status as PropertyStatus,
      featured: data.get("featured") === "on",
    },
  };
}

export type Photo = { path: string | null; url: string };
/** Moves a photo one step up (-1) or down (+1); returns the same order when the move is out of bounds. */
export function movePhoto<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir; if (j < 0 || j >= list.length) return list;
  const next = [...list]; [next[index], next[j]] = [next[j]!, next[index]!]; return next;
}
/** The cover is the chosen photo when it still exists, otherwise the first photo. */
export function pickCover(photos: Photo[], chosen: string | null) {
  const key = (p: Photo) => p.path ?? p.url;
  return photos.find(p => key(p) === chosen) ? chosen : photos[0] ? key(photos[0]) : null;
}
