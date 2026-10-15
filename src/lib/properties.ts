import photo0 from "@/assets/photo-0.asset.json";
import photo1 from "@/assets/photo-1.asset.json";
import photo2 from "@/assets/photo-2.asset.json";
import photo3 from "@/assets/photo-3.asset.json";
import photo4 from "@/assets/photo-4.asset.json";
import photo5 from "@/assets/photo-5.asset.json";
import photo6 from "@/assets/photo-6.asset.json";
import photo7 from "@/assets/photo-7.asset.json";
import photo8 from "@/assets/photo-8.asset.json";
export type Property = {id:string; title:string; purpose:string; type:string; price:number; location:string; features:string[]; image:string; description:string};
export type Filters = {purpose:string; type:string; maxprice:string; search:string};
export const defaultFilters: Filters = {purpose:"all",type:"all",maxprice:"all",search:""};
export const demoProperties: Property[] = [
{id:'M-001',title:'Casa com ótimo espaço',purpose:'Venda',type:'Casa',price:0,location:'Monte Santo de Minas · Bairro a confirmar',features:['3 quartos','Garagem','Quintal'],image:photo3.url,description:'Exemplo demonstrativo. Atualize descrição, localização, preço e disponibilidade com os dados reais do imóvel.'},
{id:'M-002',title:'Terreno residencial',purpose:'Venda',type:'Terreno',price:0,location:'Monte Santo de Minas · Localização a confirmar',features:['Residencial','Boa localização','Oportunidade'],image:photo4.url,description:'Exemplo demonstrativo de terreno. Confirme metragem, zoneamento, matrícula e condições antes de anunciar.'},
{id:'M-003',title:'Casa para locação',purpose:'Locação',type:'Casa',price:0,location:'Monte Santo de Minas · Bairro a confirmar',features:['2 quartos','Área de serviço','Residencial'],image:photo5.url,description:'Exemplo demonstrativo de imóvel para locação. Atualize aluguel, condições e disponibilidade.'},
{id:'M-004',title:'Casa para a família',purpose:'Venda',type:'Casa',price:0,location:'Monte Santo de Minas · Localização a confirmar',features:['Ambientes amplos','Garagem','Quintal'],image:photo6.url,description:'Exemplo ilustrativo. Adicione a descrição real, metragem, quartos, banheiros e demais informações confirmadas.'},
{id:'M-005',title:'Espaço comercial',purpose:'Locação',type:'Comercial',price:0,location:'Monte Santo de Minas · Localização a confirmar',features:['Comercial','Versátil','Boa visibilidade'],image:photo7.url,description:'Exemplo de espaço comercial. Confirme endereço, área útil, aluguel e condições de uso.'},
{id:'M-006',title:'Lote para construir',purpose:'Venda',type:'Terreno',price:0,location:'Monte Santo de Minas · Localização a confirmar',features:['Construção','Investimento','Residencial'],image:photo8.url,description:'Exemplo demonstrativo de lote. Inclua área, dimensões, infraestrutura e situação documental confirmadas.'}
];
export function filterProperties(properties:Property[],filters:Filters){
 const q=filters.search.trim().toLocaleLowerCase('pt-BR');
 return properties.filter(p=>(filters.purpose==='all'||p.purpose===filters.purpose)&&(filters.type==='all'||p.type===filters.type)&&(filters.maxprice==='all'||(p.price>0&&p.price<=Number(filters.maxprice)))&&(!q||(p.title+' '+p.location+' '+p.features.join(' ')).toLocaleLowerCase('pt-BR').includes(q)));
}
export function money(n:number){return n>0?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}):'Consulte o valor'}
export function safeImageUrl(value:string){try{const url=new URL(value);return url.protocol==='https:'?url.href:null}catch{return null}}
