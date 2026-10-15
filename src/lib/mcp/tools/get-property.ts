import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { demoProperties } from "@/lib/properties";
import { propertyEnquiryMessage, whatsappLink } from "@/lib/contact";
import { toPropertyJson } from "./list-properties";

export default defineTool({
  name: "get_property",
  title: "Detalhes do imóvel",
  description: "Retorna os detalhes de um imóvel de demonstração pela referência (ex.: M-001) e o link de WhatsApp para consulta.",
  inputSchema: { id: z.string().min(1).max(20).describe("Referência do imóvel, ex.: M-001.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const p = demoProperties.find(x => x.id.toLowerCase() === id.trim().toLowerCase());
    if (!p) throw new ToolError(`Imóvel ${id} não encontrado.`);
    const link = whatsappLink(propertyEnquiryMessage(p.title, p.id));
    return {
      content: [{ type: "text", text: `${p.id} — ${p.title} (DEMONSTRAÇÃO)\n${p.location}\n${p.features.join(", ")}\n${p.description}\nConsultar: ${link}` }],
      structuredContent: { property: toPropertyJson(p), whatsappLink: link },
    };
  },
});
