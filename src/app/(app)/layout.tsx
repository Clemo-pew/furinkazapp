import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { MENU } from "@/lib/navigazione";
import { Menu } from "@/components/Menu";
import { Logo } from "@/components/Logo";

// Struttura comune a tutte le pagine dopo l'accesso.
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const c = await contesto();
  // Chi ha una scheda atleta (anche se istruttore) ha la voce "Il mio profilo".
  const voci = [
    ...(c.atletaId ? [{ href: `/atleti/${c.atletaId}`, etichetta: "Il mio profilo" }] : []),
    ...MENU.filter((v) => v.ruoli.includes(c.ruolo)),
  ];

  return (
    <>
      <header className="header">
        <div className="wrap">
          <div className="top">
            <Link href="/" style={{ textDecoration: "none" }} aria-label="FurinkazApp, pagina iniziale"><Logo altezza={30} /></Link>
            <div className="bar" style={{ flexWrap: "nowrap", minWidth: 0 }}>
              <span className="chip" title={c.dojo.nome}>{c.dojo.nome}</span>
              <form action="/auth/esci" method="post"><button className="linkbtn">Esci</button></form>
            </div>
          </div>
          <Menu voci={voci} />
        </div>
      </header>
      <main className="wrap stack">{children}</main>
    </>
  );
}
