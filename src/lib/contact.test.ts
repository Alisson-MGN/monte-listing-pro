import { describe, it, expect } from "vitest";
import { whatsapp, whatsappLink, propertyEnquiryMessage } from "./contact";

describe("Contato pelo WhatsApp", () => {
  it("usa o número oficial informado pelo proprietário", () => {
    expect(whatsapp.international).toBe("5535991067561");
    expect(whatsapp.display).toBe("(35) 99106-7561");
  });
  it("monta o link com a mensagem codificada", () => {
    expect(whatsappLink("Olá! Tenho interesse.")).toBe(
      "https://wa.me/5535991067561?text=Ol%C3%A1!%20Tenho%20interesse.",
    );
  });
  it("cita o imóvel na mensagem de consulta", () => {
    expect(propertyEnquiryMessage("Casa no Centro", "M-001")).toContain("M-001");
    expect(propertyEnquiryMessage("Casa no Centro", "M-001")).toContain("Casa no Centro");
  });
});
