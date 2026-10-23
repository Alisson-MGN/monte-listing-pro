import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchFeaturedProperties, money, propertyLocation, type Property } from "@/lib/properties";

const INTERVAL = 7000;

/** Home hero frame: rotates featured listings every 7s; arrows, dots and swipe change slides. Falls back to the original illustrative photo. */
export function FeaturedCarousel({ onOpen }: { onOpen: (p: Property) => void }) {
  const { data } = useQuery({ queryKey: ["catalog", "featured"], queryFn: () => fetchFeaturedProperties(supabase) });
  const items = (data ?? []).filter(p => p.cover_image ?? p.property_images[0]?.url);
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0);
  const touch = useRef<number | null>(null);
  const n = items.length;
  const go = (d: number) => { setI(c => (c + d + n) % n); setTick(t => t + 1); };

  useEffect(() => { if (n < 2) return; const t = setTimeout(() => setI(c => (c + 1) % n), INTERVAL); return () => clearTimeout(t); }, [i, n, tick]);
  useEffect(() => { if (i >= n && n) setI(0); }, [i, n]);

  if (!n) return <div className="hero-photo"><span className="illustration-note">Foto ilustrativa</span><div className="photo-caption"><div><small>MARANGONI IMOBILIÁRIA</small><strong>Um bom negócio começa com confiança.</strong></div><span className="caption-arrow">↗</span></div></div>;

  const p = items[Math.min(i, n - 1)]!;
  return <div className="hero-photo hero-carousel" aria-roledescription="carrossel" aria-label="Imóveis em destaque"
    onTouchStart={e => { touch.current = e.touches[0]!.clientX; }}
    onTouchEnd={e => { if (touch.current === null) return; const dx = e.changedTouches[0]!.clientX - touch.current; touch.current = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
    {items.map((x, k) => <img key={x.id} src={x.cover_image ?? x.property_images[0]!.url} alt={k === i ? `Foto de ${x.title}` : ""} className={k === i ? "active" : ""} loading={k === 0 ? "eager" : "lazy"} />)}
    <span className="illustration-note">Destaque</span>
    {n > 1 && <>
      <button type="button" className="carousel-arrow prev" onClick={() => go(-1)} aria-label="Destaque anterior">‹</button>
      <button type="button" className="carousel-arrow next" onClick={() => go(1)} aria-label="Próximo destaque">›</button>
    </>}
    <button type="button" className="photo-caption carousel-caption" onClick={() => onOpen(p)} aria-label={`Ver detalhes de ${p.title}`}>
      <div><small>{p.transaction_type === "venda" ? "À VENDA" : "PARA ALUGAR"} · {money(p.price)}</small><strong>{p.title}</strong><small>⌖ {propertyLocation(p)}</small></div>
      <span className="caption-arrow">↗</span>
    </button>
    {n > 1 && <div className="carousel-dots">{items.map((x, k) => <button key={x.id} type="button" className={k === i ? "active" : ""} onClick={() => { setI(k); setTick(t => t + 1); }} aria-label={`Ir para destaque ${k + 1} de ${n}`} />)}</div>}
  </div>;
}
