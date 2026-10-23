import { describe, it, expect } from "vitest";
import { money, safeImageUrl, sanitizeSearch, parseSearch, propertyGallery, sortImages, type Property } from "./properties";

describe("Catálogo", () => {
  it("mostra 'Consulte o valor' quando o preço não foi informado", () => { expect(money(0)).toBe("Consulte o valor"); expect(money(null)).toBe("Consulte o valor"); });
  it("não aceita URLs executáveis para fotos", () => { expect(safeImageUrl("javascript:alert(1)")).toBeNull(); expect(safeImageUrl("http://x.com/a.jpg")).toBeNull(); expect(safeImageUrl("https://example.com/foto.jpg")).toBe("https://example.com/foto.jpg"); });
  it("remove caracteres que alterariam o filtro de busca", () => { expect(sanitizeSearch("Centro,status.eq.draft)")).toBe("Centro status eq draft"); });
  it("reconhece quartos, banheiros e vagas com número, singular ou plural", () => {
    expect(parseSearch("quarto 3")).toMatchObject({ bedrooms: 3, text: "" });
    expect(parseSearch("Banheiros 2")).toMatchObject({ bathrooms: 2, text: "" });
    expect(parseSearch("vaga 2")).toMatchObject({ parking: 2, parkingAny: false });
    expect(parseSearch("garagem 2")).toMatchObject({ parking: 2, parkingAny: false });
  });
  it("garagem ou vaga sem número pede ao menos uma vaga", () => {
    expect(parseSearch("garagem")).toMatchObject({ parking: null, parkingAny: true, text: "" });
    expect(parseSearch("VAGAS")).toMatchObject({ parkingAny: true, text: "" });
  });
  it("combina bairro com características e ignora acentos", () => {
    expect(parseSearch("bairro Centro quarto 3 vaga 2")).toMatchObject({ bedrooms: 3, parking: 2, text: "bairro centro" });
  });
  it("palavras comuns continuam como texto livre", () => {
    expect(parseSearch("casa ampla")).toMatchObject({ bedrooms: null, bathrooms: null, parking: null, parkingAny: false, text: "casa ampla" });
  });
  it("preserva a ordem das fotos e coloca a capa primeiro", () => {
    const p = sortImages({ cover_image: "https://c/capa.jpg", property_images: [{ id: "b", url: "https://c/2.jpg", position: 1 }, { id: "a", url: "https://c/1.jpg", position: 0 }] } as Property);
    expect(propertyGallery(p)).toEqual(["https://c/capa.jpg", "https://c/1.jpg", "https://c/2.jpg"]);
  });
});
