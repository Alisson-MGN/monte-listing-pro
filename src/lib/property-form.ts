import { safeImageUrl, type PropertyStatus, type PropertyType, type TransactionType } from "./properties";

export type PropertyInput = {
  title: string; description: string; property_type: PropertyType; transaction_type: TransactionType;
  price: number; condominium_fee: number | null; iptu: number | null;
  bedrooms: number; bathrooms: number; parking_spaces: number; area_m2: number | null;
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
export function parsePropertyForm(data: FormData): { input: PropertyInput; images: string[] } {
  const title = String(data.get("title") ?? "").trim();
  if (!title) throw new Error("Informe o título do imóvel.");
  if (title.length > 160) throw new Error("O título deve ter até 160 caracteres.");
  const property_type = String(data.get("property_type"));
  if (!TYPES.includes(property_type)) throw new Error("Escolha o tipo do imóvel.");
  const transaction_type = String(data.get("transaction_type"));
  if (transaction_type !== "venda" && transaction_type !== "aluguel") throw new Error("Escolha venda ou aluguel.");
  const status = String(data.get("status") ?? "draft");
  if (!STATUS.includes(status)) throw new Error("Situação inválida.");
  const coverRaw = String(data.get("cover_image") ?? "").trim();
  const cover_image = coverRaw ? safeImageUrl(coverRaw) : null;
  if (coverRaw && !cover_image) throw new Error("A foto de capa deve ser um link que comece com https://.");
  const images: string[] = [];
  for (const line of String(data.get("images") ?? "").split(/\r?\n/)) {
    const t = line.trim(); if (!t) continue;
    const url = safeImageUrl(t);
    if (!url) throw new Error(`Link de foto inválido: ${t.slice(0, 60)}. Use links que comecem com https://.`);
    images.push(url);
  }
  const state = String(data.get("state") ?? "").trim().toUpperCase();
  if (state && !/^[A-Z]{2}$/.test(state)) throw new Error("Estado: use a sigla com 2 letras, ex.: MG.");
  const address = String(data.get("address") ?? "").trim() || null;
  return {
    images,
    input: {
      title, description: String(data.get("description") ?? "").trim(),
      property_type: property_type as PropertyType, transaction_type: transaction_type as TransactionType,
      price: num(data.get("price"), "Preço") ?? 0,
      condominium_fee: num(data.get("condominium_fee"), "Condomínio", { optional: true }),
      iptu: num(data.get("iptu"), "IPTU", { optional: true }),
      bedrooms: num(data.get("bedrooms"), "Quartos", { int: true }) ?? 0,
      bathrooms: num(data.get("bathrooms"), "Banheiros", { int: true }) ?? 0,
      parking_spaces: num(data.get("parking_spaces"), "Vagas", { int: true }) ?? 0,
      area_m2: num(data.get("area_m2"), "Área", { optional: true }),
      address, show_address: Boolean(address) && data.get("show_address") === "on",
      neighborhood: String(data.get("neighborhood") ?? "").trim(),
      city: String(data.get("city") ?? "").trim() || "Monte Santo de Minas",
      state: state || "MG", cover_image, status: status as PropertyStatus,
      featured: data.get("featured") === "on",
    },
  };
}
