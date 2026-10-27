import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { MENU } from "@/lib/navigazione";
import { Menu } from "@/components/Menu";

// Struttura comune a tutte le pagine dopo l'accesso.
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const c = await contesto();
  const voci = c.staff
    ? MENU.filter((v) => v.ruoli.includes(c.ruolo))
    : [{ href: `/atleti/${c.atletaId}`, etichetta: "Il mio profilo" }];

  return (
    <>
      <header className="header">
        <div className="wrap">
          <div className="top">
            <Link href="/" className="logo"><i aria-hidden="true" />Registro Dojo</Link>
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
