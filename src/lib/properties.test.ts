import { describe, it, expect } from "vitest";
import { money, safeImageUrl, sanitizeSearch, propertyGallery, sortImages, type Property } from "./properties";

describe("Catálogo", () => {
  it("mostra 'Consulte o valor' quando o preço não foi informado", () => { expect(money(0)).toBe("Consulte o valor"); expect(money(null)).toBe("Consulte o valor"); });
  it("não aceita URLs executáveis para fotos", () => { expect(safeImageUrl("javascript:alert(1)")).toBeNull(); expect(safeImageUrl("http://x.com/a.jpg")).toBeNull(); expect(safeImageUrl("https://example.com/foto.jpg")).toBe("https://example.com/foto.jpg"); });
  it("remove caracteres que alterariam o filtro de busca", () => { expect(sanitizeSearch("Centro,status.eq.draft)")).toBe("Centro status eq draft"); });
  it("preserva a ordem das fotos e coloca a capa primeiro", () => {
    const p = sortImages({ cover_image: "https://c/capa.jpg", property_images: [{ id: "b", url: "https://c/2.jpg", position: 1 }, { id: "a", url: "https://c/1.jpg", position: 0 }] } as Property);
    expect(propertyGallery(p)).toEqual(["https://c/capa.jpg", "https://c/1.jpg", "https://c/2.jpg"]);
  });
});
