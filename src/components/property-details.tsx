import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { PropertyImage } from "@/components/property-image";
import { money, type Property } from "@/lib/properties";

export function PropertyDetails({property,onClose,onContact}:{property:Property|null;onClose:()=>void;onContact:()=>void}){
 return <Dialog.Root open={Boolean(property)} onOpenChange={open=>{if(!open)onClose()}}><Dialog.Portal><Dialog.Overlay className="modal open"><Dialog.Content className="modal-box">
  <div className="modal-head"><div className="eyebrow">Detalhes do imóvel · Demonstração</div><Dialog.Close asChild><Button variant="prototype-close" size="prototype" aria-label="Fechar">✕</Button></Dialog.Close></div>
  {property&&<><PropertyImage key={property.image} src={property.image} title={property.title}/><Dialog.Title asChild><h2>{property.title}</h2></Dialog.Title><p className="modal-location">⌖ {property.location} · Referência {property.id}</p><div className="price">{money(property.price)}</div><Dialog.Description asChild><p>{property.description}</p></Dialog.Description><p>{property.features.join(' · ')}</p><Button variant="prototype-gold" size="prototype" onClick={onContact}>Consultar pelo WhatsApp ↗</Button></>}
 </Dialog.Content></Dialog.Overlay></Dialog.Portal></Dialog.Root>
}