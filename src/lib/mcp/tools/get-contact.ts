import { defineTool } from "@lovable.dev/mcp-js";
import { whatsapp, whatsappLink } from "@/lib/contact";

export default defineTool({
  name: "get_contact",
  title: "Contato da Marangoni",
  description: "Retorna o WhatsApp oficial e a cidade de atendimento da Marangoni Despachante Imobiliário.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const link = whatsappLink("Olá! Gostaria de falar com a Marangoni.");
    return {
      content: [{ type: "text", text: `WhatsApp ${whatsapp.display} · Monte Santo de Minas, MG · ${link}` }],
      structuredContent: { whatsapp: whatsapp.display, city: "Monte Santo de Minas, MG", whatsappLink: link },
    };
  },
});
