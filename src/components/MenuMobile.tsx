"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  voci: { href: string; etichetta: string }[];
  dojo: string;
  ruolo: string;
}

/**
 * Menu "hamburger" per il telefono: un pulsante che apre un pannello laterale con le sezioni.
 * Si chiude toccando una voce, il fondo scuro, la X o il tasto Esc. Su schermi larghi è nascosto (vedi globals.css).
 */
export function MenuMobile({ voci, dojo, ruolo }: Props) {
  const [aperto, setAperto] = useState(false);
  const path = usePathname();
  const pannello = useRef<HTMLDivElement>(null);
  const pulsante = useRef<HTMLButtonElement>(null);

  // chiudi quando cambia pagina
  useEffect(() => setAperto(false), [path]);

  useEffect(() => {
    if (!aperto) return;
    const prima = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // la pagina sotto non scorre
    pannello.current?.querySelector<HTMLElement>("a, button")?.focus();
    const tasto = (e: KeyboardEvent) => { if (e.key === "Escape") setAperto(false); };
    window.addEventListener("keydown", tasto);
    return () => {
      document.body.style.overflow = prima;
      window.removeEventListener("keydown", tasto);
      pulsante.current?.focus();
    };
  }, [aperto]);

  const attiva = (href: string) => path === href || path.startsWith(href + "/");
  const corrente = voci.find((v) => attiva(v.href))?.etichetta;

  return (
    <div className="menu-mobile">
      <button ref={pulsante} type="button" className="hamburger" aria-label="Apri il menu" aria-expanded={aperto} aria-controls="pannello-menu"
        onClick={() => setAperto(true)}>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        {corrente && <b className="hamburger-sezione">{corrente}</b>}
      </button>

      <div className={`menu-fondo ${aperto ? "aperto" : ""}`} onClick={() => setAperto(false)} aria-hidden="true" />
      <div ref={pannello} id="pannello-menu" className={`menu-pannello ${aperto ? "aperto" : ""}`}
        role="dialog" aria-modal="true" aria-label="Menu" inert={!aperto}>
        <div className="menu-testa">
          <div className="stack-s" style={{ gap: 2, minWidth: 0 }}>
            <b className="menu-dojo">{dojo}</b>
            <span className="hint">{ruolo}</span>
          </div>
          <button type="button" className="x" onClick={() => setAperto(false)} aria-label="Chiudi il menu">✕</button>
        </div>
        <nav aria-label="Sezioni" className="menu-voci">
          {voci.map((v) => (
            <Link key={v.href} href={v.href} aria-current={attiva(v.href) ? "page" : undefined} onClick={() => setAperto(false)}>
              {v.etichetta}
            </Link>
          ))}
        </nav>
        <form action="/auth/esci" method="post" className="menu-esci">
          <button className="btn" style={{ width: "100%" }}>Esci</button>
        </form>
      </div>
    </div>
  );
}
