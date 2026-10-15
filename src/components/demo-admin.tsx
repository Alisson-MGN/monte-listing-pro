import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { demoProperties, safeImageUrl, type Property } from "@/lib/properties";

export function DemoAdmin({count,onAdd}:{count:number;onAdd:(property:Property)=>void}){
 const [status,setStatus]=useState('');
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault(); const form=event.currentTarget;const data=new FormData(form);
  const title=String(data.get('title')??'').trim();if(!title){setStatus('Informe o nome do imóvel.');return;}
  const price=Number(data.get('price')||0);if(!Number.isFinite(price)||price<0){setStatus('Informe um preço válido, igual ou maior que zero.');return;}
  const entered=String(data.get('image')??'').trim(); const image=entered?safeImageUrl(entered):demoProperties[0]?.image;
  if(!image){setStatus('Informe uma URL de foto válida que comece com https://.');return;}
  onAdd({id:'DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),title,purpose:String(data.get('purpose')),type:String(data.get('type')),price,location:String(data.get('location')??'').trim()||'Localização a confirmar',features:String(data.get('features')??'').split(',').map(f=>f.trim()).filter(Boolean),image,description:'Cadastro de demonstração nesta sessão. As informações não representam um anúncio real confirmado.'});
  form.reset();setStatus('Imóvel adicionado apenas nesta demonstração. Não foi publicado e será removido ao recarregar a página.');
 }
 return <details className="demo-disclosure"><summary className="admin-link">Área de demonstração (não usar em produção)</summary><div className="admin-panel"><p>Este painel mantém dados somente nesta sessão. Não tem login e não publica imóveis na internet. Ao recarregar a página, os cadastros são descartados.</p><form className="admin-form" onSubmit={submit}>
  <div className="demo-field"><label htmlFor="a-title">Nome do imóvel</label><input id="a-title" name="title" placeholder="Nome do imóvel" required/></div>
  <div className="demo-field"><label htmlFor="a-purpose">Finalidade</label><select id="a-purpose" name="purpose"><option>Venda</option><option>Locação</option></select></div>
  <div className="demo-field"><label htmlFor="a-type">Tipo de imóvel</label><select id="a-type" name="type"><option>Casa</option><option>Terreno</option><option>Comercial</option></select></div>
  <div className="demo-field"><label htmlFor="a-price">Preço em R$ (demonstração)</label><input id="a-price" name="price" type="number" min="0" step="0.01" placeholder="Preço em R$"/></div>
  <div className="demo-field"><label htmlFor="a-location">Bairro / cidade (demonstração)</label><input id="a-location" name="location" placeholder="Bairro / cidade"/></div>
  <div className="demo-field"><label htmlFor="a-image">URL da foto ilustrativa (opcional)</label><input id="a-image" name="image" type="url" placeholder="https://…"/></div>
  <div className="demo-field"><label htmlFor="a-features">Características</label><input id="a-features" name="features" placeholder="Ex.: 3 quartos, garagem"/></div>
  <Button variant="prototype-gold" size="prototype" type="submit">Adicionar à demonstração</Button>
 </form><div className="form-status" role="status">{status}</div><div className="admin-list">Imóveis nesta demonstração: {count}. Alterações ficam apenas nesta sessão do navegador.</div></div></details>
}