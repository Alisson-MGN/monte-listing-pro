import { defineMcp } from "@lovable.dev/mcp-js";
import listProperties from "./tools/list-properties";
import getProperty from "./tools/get-property";
import getContact from "./tools/get-contact";

export default defineMcp({
  name: "monte-listing-pro",
  title: "Monte Listing Pro",
  version: "0.1.0",
  instructions: "Ferramentas públicas da Marangoni Despachante Imobiliário (Monte Santo de Minas, MG). Os imóveis são exemplos de demonstração, não anúncios reais; informe isso ao usuário. Use list_properties para buscar, get_property para detalhes e get_contact para o WhatsApp.",
  tools: [listProperties, getProperty, getContact],
});
