import { useState } from "react";

export function PropertyImage({src,title,lazy=false}:{src:string|null|undefined;title:string;lazy?:boolean}){
  const [failed,setFailed]=useState(false);
  return failed||!src ? <div className="photo-error">Foto indisponível</div> : <img src={src} alt={`Foto de ${title}`} loading={lazy?'lazy':'eager'} onError={()=>setFailed(true)}/>;
}
