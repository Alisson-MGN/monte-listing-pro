import { describe,it,expect } from "vitest";
import {demoProperties,filterProperties,defaultFilters,money,safeImageUrl} from "./properties";

describe('Catálogo demonstrativo',()=>{
 it('mantém os seis exemplos fornecidos sem preços reais inventados',()=>{expect(demoProperties).toHaveLength(6);expect(demoProperties.every(p=>p.price===0)).toBe(true);expect(money(0)).toBe('Consulte o valor');});
 it('combina finalidade, tipo e palavra-chave',()=>{expect(filterProperties(demoProperties,{...defaultFilters,purpose:'Locação',type:'Casa',search:'ÁREA DE SERVIÇO'}).map(p=>p.id)).toEqual(['M-003']);});
 it('exclui preços não informados e respeita o teto do filtro',()=>{const base=demoProperties[0];if(!base)throw new Error('Exemplo ausente');expect(filterProperties([{...base,id:'zero',price:0},{...base,id:'limite',price:150000},{...base,id:'acima',price:150001}],{...defaultFilters,maxprice:'150000'}).map(p=>p.id)).toEqual(['limite']);});
 it('restaura todos os exemplos ao limpar filtros',()=>{expect(filterProperties(demoProperties,defaultFilters)).toHaveLength(6);});
 it('não aceita URLs executáveis para fotos',()=>{expect(safeImageUrl('javascript:alert(1)')).toBeNull();expect(safeImageUrl('https://example.com/foto.jpg')).toBe('https://example.com/foto.jpg');});
});