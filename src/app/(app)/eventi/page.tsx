import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { elencoEventi } from "@/lib/data/query";
import { meseCorrente, meseEsteso, oggi } from "@/lib/domain/date";
import { eventiFuturi, spostaMese, TIPI_EVENTO } from "@/lib/domain/eventi";
import { Calendario } from "@/components/Calendario";
import { SchedaEvento } from "@/components/SchedaEvento";

export const metadata: Metadata = { title: "Eventi" };

export default async function Eventi({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  const c = await contesto();
  const richiesto = (await searchParams).mese;
  const mese = richiesto && /^\d{4}-\d{2}$/.test(richiesto) ? richiesto : meseCorrente();
  const oggiStr = oggi();
  // il calendario mostra anche qualche giorno del mese prima e dopo
  const [delMese, futuri] = await Promise.all([
    elencoEventi(c.dojo.id, `${spostaMese(mese, -1)}-20`, `${spostaMese(mese, 1)}-10`),
    elencoEventi(c.dojo.id, oggiStr),
  ]);

  if (delMese === null) {
    return (
      <div className="card">
        <h1>Eventi</h1>
        <p className="errore">Manca la tabella degli eventi nel database.</p>
        <p className="hint">In Supabase apri SQL Editor → New query, incolla il file <span className="num">supabase/migrations/0010_eventi.sql</span> del repository e premi Run. Poi ricarica questa pagina.</p>
      </div>
    );
  }

  const nelMese = delMese.filter((e) => e.data_inizio.slice(0, 7) <= mese && (e.data_fine ?? e.data_inizio).slice(0, 7) >= mese);
  const prossimi = eventiFuturi(futuri ?? [], oggiStr).filter((e) => !nelMese.some((x) => x.id === e.id)).slice(0, 5);

  return (
    <>
      <div className="testata">
        <h1>Eventi</h1>
        {c.staff && <Link className="btn primary" href={`/eventi/nuovo${mese !== meseCorrente() ? `?data=${mese}-01` : ""}`}>+ Nuovo evento</Link>}
      </div>

      <section className="card">
        <div className="testata" style={{ alignItems: "center" }}>
          <Link className="btn small" href={`/eventi?mese=${spostaMese(mese, -1)}`} scroll={false} aria-label="Mese precedente">‹</Link>
          <h2 style={{ textTransform: "capitalize", textAlign: "center", flex: 1 }}>{meseEsteso(mese)}</h2>
          <Link className="btn small" href={`/eventi?mese=${spostaMese(mese, 1)}`} scroll={false} aria-label="Mese successivo">›</Link>
        </div>
        <Calendario mese={mese} eventi={delMese} oggi={oggiStr} staff={c.staff} />
        <div className="bar" style={{ justifyContent: "space-between" }}>
          <div className="seg">
            {TIPI_EVENTO.map((t) => (
              <span key={t.chiave} className="hint legenda"><i style={{ background: t.colore }} />{t.nome}</span>
            ))}
          </div>
          {mese !== meseCorrente() && <Link className="btn small" href="/eventi" scroll={false}>Torna a oggi</Link>}
        </div>
        {c.staff && <p className="hint">Tocca un giorno libero per aggiungere un evento in quella data.</p>}
      </section>

      <section className="stack-s">
        <h3>Eventi di <span style={{ textTransform: "none" }}>{meseEsteso(mese)}</span></h3>
        {nelMese.length ? (
          <div className="list">{nelMese.map((e) => <SchedaEvento key={e.id} evento={e} oggi={oggiStr} staff={c.staff} />)}</div>
        ) : (
          <p className="hint">Nessun evento in questo mese.</p>
        )}
      </section>

      {prossimi.length > 0 && (
        <section className="stack-s">
          <h3>Più avanti</h3>
          <div className="list">{prossimi.map((e) => <SchedaEvento key={e.id} evento={e} oggi={oggiStr} staff={c.staff} />)}</div>
        </section>
      )}
    </>
  );
}
