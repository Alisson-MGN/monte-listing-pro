import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { defaultFilters, fetchPublishedProperties, money, propertyFeatures, propertyLocation, reference, type Property } from "@/lib/properties";

/** Read-only public client for published listings (created per request). */
export function publicClient() {
  const url = process.env.SUPABASE_URL!; const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  });
}

export const toPropertyJson = (p: Property) => ({
  reference: reference(p.id), id: p.id, title: p.title, transaction_type: p.transaction_type, property_type: p.property_type,
  price: money(p.price), location: propertyLocation(p), features: propertyFeatures(p), description: p.description,
  photos: p.property_images.map(i => i.url), cover_image: p.cover_image,
});

export default defineTool({
  name: "list_properties",
  title: "Listar imóveis",
  description: "Lista os imóveis publicados da Marangoni, com filtros opcionais de finalidade, tipo e palavra-chave.",
  inputSchema: {
    purpose: z.enum(["venda", "aluguel"]).optional().describe("Finalidade."),
    type: z.enum(["casa", "apartamento", "terreno", "comercial", "rural"]).optional().describe("Tipo do imóvel."),
    search: z.string().max(100).optional().describe("Bairro ou palavra-chave."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ purpose, type, search }) => {
    const list = await fetchPublishedProperties(publicClient(), { ...defaultFilters, purpose: purpose ?? "all", type: type ?? "all", search: search ?? "" });
    const text = list.length ? list.map(p => `${reference(p.id)}: ${p.title} · ${p.transaction_type} · ${p.property_type} · ${money(p.price)}`).join("\n") : "Nenhum imóvel publicado encontrado.";
    return { content: [{ type: "text", text }], structuredContent: { properties: list.map(toPropertyJson) } };
  },
});
