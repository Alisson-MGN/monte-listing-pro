export const whatsapp = {
  display: "(35) 99106-7561",
  international: "5535991067561",
};

export function whatsappLink(message: string) {
  return `https://wa.me/${whatsapp.international}?text=${encodeURIComponent(message)}`;
}

export function propertyEnquiryMessage(title: string, id: string) {
  return `Olá! Vi o imóvel "${title}" (referência ${id}) no site da Marangoni e gostaria de mais informações.`;
}
