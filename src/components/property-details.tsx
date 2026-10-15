import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { PropertyImage } from "@/components/property-image";
import { money, propertyFeatures, propertyGallery, propertyLocation, reference, transactionTypes, typeLabel, type Property } from "@/lib/properties";
import { propertyEnquiryMessage, whatsappLink } from "@/lib/contact";

export function PropertyDetails({property,onClose}:{property:Property|null;onClose:()=>void}){
 return <Dialog.Root open={Boolean(property)} onOpenChange={open=>{if(!open)onClose()}}><Dialog.Portal><Dialog.Overlay className="modal open"><Dialog.Content className="modal-box">
  <div className="modal-head"><div className="eyebrow">Detalhes do imóvel</div><Dialog.Close asChild><Button variant="prototype-close" size="prototype" aria-label="Fechar">✕</Button></Dialog.Close></div>
  {property&&<Body key={property.id} property={property}/>}
 </Dialog.Content></Dialog.Overlay></Dialog.Portal></Dialog.Root>
}

function Body({property:p}:{property:Property}){
 const gallery=propertyGallery(p);
 const [index,setIndex]=useState(0);
 const ref=reference(p.id);
 const extras=[p.condominium_fee?`Condomínio ${money(p.condominium_fee)}`:null,p.iptu?`IPTU ${money(p.iptu)}`:null].filter(Boolean);
 return <>
  <PropertyImage key={gallery[index]??'none'} src={gallery[index]} title={p.title}/>
  {gallery.length>1&&<div className="gallery-thumbs" role="list" aria-label="Fotos do imóvel">{gallery.map((url,i)=><button key={url+i} type="button" role="listitem" className={`gallery-thumb${i===index?' active':''}`} onClick={()=>setIndex(i)} aria-label={`Ver foto ${i+1} de ${gallery.length}`}><img src={url} alt="" loading="lazy"/></button>)}</div>}
  <Dialog.Title asChild><h2>{p.title}</h2></Dialog.Title>
  <p className="modal-location">⌖ {propertyLocation(p)} · Referência {ref}</p>
  <div className="price">{money(p.price)}{p.transaction_type==='aluguel'&&p.price>0?' / mês':''}</div>
  <p>{typeLabel(p.property_type)} · {transactionTypes.find(t=>t.value===p.transaction_type)?.label}{extras.length?' · '+extras.join(' · '):''}</p>
  <Dialog.Description asChild><p style={{whiteSpace:'pre-line'}}>{p.description||'Entre em contato para mais informações sobre este imóvel.'}</p></Dialog.Description>
  {propertyFeatures(p).length>0&&<p>{propertyFeatures(p).join(' · ')}</p>}
  <Button asChild variant="prototype-gold" size="prototype"><a href={whatsappLink(propertyEnquiryMessage(p.title,ref))} target="_blank" rel="noopener noreferrer">Consultar pelo WhatsApp ↗</a></Button>
 </>;
}
