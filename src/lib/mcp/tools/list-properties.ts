import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { defaultFilters, demoProperties, filterProperties, money, type Property } from "@/lib/properties";

export const toPropertyJson = (p: Property) => ({
  id: p.id, title: p.title, purpose: p.purpose, type: p.type,
  price: money(p.price), location: p.location, features: [...p.features],
  description: p.description, demonstration: true,
});

export default defineTool({
  name: "list_properties",
  title: "Listar imóveis",
  description: "Lista os imóveis de demonstração da Marangoni, com filtros opcionais de finalidade, tipo e palavra-chave.",
  inputSchema: {
    purpose: z.enum(["Venda", "Locação"]).optional().describe("Finalidade: Venda ou Locação."),
    type: z.enum(["Casa", "Terreno", "Comercial"]).optional().describe("Tipo do imóvel."),
    search: z.string().max(100).optional().describe("Bairro ou palavra-chave."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ purpose, type, search }) => {
    const list = filterProperties(demoProperties, {
      ...defaultFilters, purpose: purpose ?? "all", type: type ?? "all", search: search ?? "",
    });
    const text = list.length
      ? "Imóveis de DEMONSTRAÇÃO (dados ilustrativos):\n" + list.map(p => `${p.id}: ${p.title} · ${p.purpose} · ${p.type} · ${money(p.price)}`).join("\n")
      : "Nenhum imóvel encontrado.";
    return { content: [{ type: "text", text }], structuredContent: { properties: list.map(toPropertyJson) } };
  },
});
