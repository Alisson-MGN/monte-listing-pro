import { useState } from "react";

export function PropertyImage({src,title,lazy=false}:{src:string;title:string;lazy?:boolean}){
  const [failed,setFailed]=useState(false);
  return failed ? <div className="photo-error">Foto ilustrativa indisponível</div> : <img src={src} alt={`Foto ilustrativa de ${title}`} loading={lazy?'lazy':'eager'} onError={()=>setFailed(true)}/>;
}