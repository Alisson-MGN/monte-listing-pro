import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { defaultFilters, fetchPublishedProperties, propertyFeatures, propertyLocation, reference } from "@/lib/properties";
import { propertyEnquiryMessage, whatsappLink } from "@/lib/contact";
import { publicClient, toPropertyJson } from "./list-properties";

export default defineTool({
  name: "get_property",
  title: "Detalhes do imóvel",
  description: "Retorna os detalhes de um imóvel publicado pela referência de 8 caracteres e o link de WhatsApp para consulta.",
  inputSchema: { id: z.string().min(4).max(40).describe("Referência do imóvel exibida no site.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const ref = id.trim().toUpperCase();
    const p = (await fetchPublishedProperties(publicClient(), defaultFilters)).find(x => reference(x.id) === ref || x.id === id.trim());
    if (!p) throw new ToolError(`Imóvel ${id} não encontrado.`);
    const link = whatsappLink(propertyEnquiryMessage(p.title, reference(p.id)));
    return {
      content: [{ type: "text", text: `${reference(p.id)} — ${p.title}\n${propertyLocation(p)}\n${propertyFeatures(p).join(", ")}\n${p.description}\nConsultar: ${link}` }],
      structuredContent: { property: toPropertyJson(p), whatsappLink: link },
    };
  },
});
