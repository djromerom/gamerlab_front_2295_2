import "@/features/public/components/gallery/FairGallery.css";
import { memo, useEffect, useRef } from "react";
import { FAIRS } from "./fairs";
import { mountFairGallery } from "./gallery";

/**
 * Galería de las ferias pasadas (ARK-233): carrusel 3D con pestañas por feria y visor para ampliar las fotos.
 * React pinta el armazón una vez; las tarjetas, las pestañas y el visor los maneja gallery.ts.
 */
function FairGallery() {
  const seccionRef = useRef<HTMLElement>(null);
  const visorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seccionRef.current || !visorRef.current) return;
    return mountFairGallery(seccionRef.current, visorRef.current, FAIRS);
  }, []);

  return (
    <>
      <section ref={seccionRef} className="galeria" id="galeria" aria-roledescription="carrusel" aria-labelledby="galTitulo">
        <div className="gal-cabeza">
          <div>
            <p className="ceja">EDICIONES PASADAS</p>
            <h2 id="galTitulo">Así se vivió la Feria Gamer</h2>
            <p className="desc">Recorre las fotos de cada feria. <span className="solo-mouse">Mueve el mouse sobre la galería para verlas en profundidad.</span><span className="solo-tactil">Desliza para pasar de foto y tócala para ampliarla.</span></p>
          </div>
          <div className="ferias" role="tablist" aria-label="Elige una feria" id="ferias"></div>
        </div>
        <div className="escenario" id="escenario" tabIndex={0} aria-label="Fotos de la feria. Usa las flechas del teclado para avanzar.">
          <div className="carril" id="carril"></div>
        </div>
        <div className="controles vidrio">
          <button className="flecha" type="button" id="ant" aria-label="Foto anterior">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <div className="progreso">
            <div className="contador"><b id="num" /><span id="nombreFeria"></span></div>
            <div className="barra" id="barra" role="slider" tabIndex={0} aria-label="Posición en la galería" aria-valuemin={1} aria-valuenow={1} aria-valuemax={FAIRS[0].fotos.length}><i id="relleno"></i></div>
          </div>
          <button className="flecha" type="button" id="sig" aria-label="Foto siguiente">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>
        <p className="sr" aria-live="polite" id="anuncio"></p>
      </section>
      <div ref={visorRef} className="visor" id="visor" role="dialog" aria-modal="true" aria-label="Foto ampliada">
      <button className="flecha cerrar" type="button" id="cerrar" aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <button className="flecha ant" type="button" id="vAnt" aria-label="Foto anterior">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
      <figure><img id="vImg" alt="" /><figcaption id="vPie"></figcaption></figure>
      <button className="flecha sig" type="button" id="vSig" aria-label="Foto siguiente">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>
    </>
  );
}

export default memo(FairGallery);
