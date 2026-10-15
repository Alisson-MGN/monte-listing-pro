import { describe, it, expect } from "vitest";
import { parsePropertyForm } from "./property-form";

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries({ title: "Casa", property_type: "casa", transaction_type: "venda", status: "draft", ...o })) f.set(k, v); return f; };

describe("Formulário administrativo", () => {
  it("cria como rascunho por padrão", () => { expect(parsePropertyForm(fd({})).input.status).toBe("draft"); });
  it("exige título", () => { expect(() => parsePropertyForm(fd({ title: " " }))).toThrow("título"); });
  it("rejeita preço negativo", () => { expect(() => parsePropertyForm(fd({ price: "-1" }))).toThrow("Preço"); });
  it("deixa condomínio e IPTU vazios como não informados", () => { const { input } = parsePropertyForm(fd({})); expect(input.condominium_fee).toBeNull(); expect(input.iptu).toBeNull(); });
  it("mantém a ordem das fotos e rejeita links sem https", () => {
    expect(parsePropertyForm(fd({ images: "https://a/2.jpg\nhttps://a/1.jpg" })).images).toEqual(["https://a/2.jpg", "https://a/1.jpg"]);
    expect(() => parsePropertyForm(fd({ images: "http://a/1.jpg" }))).toThrow("https://");
  });
  it("só exibe o endereço publicamente quando marcado", () => {
    expect(parsePropertyForm(fd({ address: "Rua A, 1" })).input.show_address).toBe(false);
    expect(parsePropertyForm(fd({ address: "Rua A, 1", show_address: "on" })).input.show_address).toBe(true);
  });
});
