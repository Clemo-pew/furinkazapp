import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { elencoIncontri } from "@/lib/data/query";
import { ElencoIncontri } from "@/components/ElencoIncontri";

export const metadata: Metadata = { title: "Kumite" };

export default async function Kumite() {
  const c = await contesto();
  const incontri = await elencoIncontri(c.dojo.id);
  return (
    <>
      <div className="testata">
        <h1>Kumite</h1>
        {c.staff && <Link className="btn primary" href="/kumite/nuovo">+ Registra incontro</Link>}
      </div>
      <p className="hint">
        Per ogni punto segni chi segna, la tecnica, la zona, il lato del corpo colpito e la situazione.
        Il punteggio segue le regole WKF: Yuko 1, Waza-ari 2, Ippon 3.
      </p>
      {incontri.length ? (
        <ElencoIncontri incontri={incontri} staff={c.staff} />
      ) : (
        <div className="list"><div className="empty">
          <b>Nessun incontro registrato.</b>
          <p className="hint">Registra il primo incontro di allenamento: l&apos;analisi dei punti deboli compare nella scheda di ogni atleta.</p>
        </div></div>
      )}
    </>
  );
}
