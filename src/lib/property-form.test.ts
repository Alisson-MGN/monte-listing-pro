import { describe, it, expect } from "vitest";
import { parsePropertyForm, movePhoto, pickCover } from "./property-form";

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries({ title: "Casa", property_type: "casa", transaction_type: "venda", status: "draft", ...o })) f.set(k, v); return f; };

describe("Formulário administrativo", () => {
  it("cria como rascunho por padrão", () => { expect(parsePropertyForm(fd({})).input.status).toBe("draft"); });
  it("exige título", () => { expect(() => parsePropertyForm(fd({ title: " " }))).toThrow("título"); });
  it("rejeita preço negativo", () => { expect(() => parsePropertyForm(fd({ price: "-1" }))).toThrow("Preço"); });
  it("deixa condomínio e IPTU vazios como não informados", () => { const { input } = parsePropertyForm(fd({})); expect(input.condominium_fee).toBeNull(); expect(input.iptu).toBeNull(); });
  it("reordena fotos sem sair dos limites", () => { expect(movePhoto(["a","b","c"], 2, -1)).toEqual(["a","c","b"]); expect(movePhoto(["a","b"], 0, -1)).toEqual(["a","b"]); });
  it("usa a primeira foto como capa se a escolhida foi removida", () => { const ph=[{path:"x",url:""},{path:"y",url:""}]; expect(pickCover(ph,"y")).toBe("y"); expect(pickCover(ph,"z")).toBe("x"); expect(pickCover([],"z")).toBeNull(); });
  it("só exibe o endereço publicamente quando marcado", () => {
    expect(parsePropertyForm(fd({ address: "Rua A, 1" })).input.show_address).toBe(false);
    expect(parsePropertyForm(fd({ address: "Rua A, 1", show_address: "on" })).input.show_address).toBe(true);
  });
});
