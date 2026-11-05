import type { Metadata } from "next";
import Link from "next/link";
import { contesto } from "@/lib/data/contesto";
import { elencoAllenamenti, elencoAtleti } from "@/lib/data/query";
import { formatoDurata } from "@/lib/domain/diario";
import { ElencoDiario } from "./ElencoDiario";
import { meseCorrente } from "@/lib/domain/date";
import type { Allenamento } from "@/lib/domain/tipi";

export const metadata: Metadata = { title: "Diario allenamenti" };

export default async function Diario() {
  const c = await contesto();
  let mancaTabella = false;
  const [allenamenti, atleti] = await Promise.all([
    elencoAllenamenti(c.dojo.id).catch((): Allenamento[] => { mancaTabella = true; return []; }),
    elencoAtleti(c.dojo.id, { archiviati: true }),
  ]);
  const nome = new Map(atleti.map((a) => [a.id, a.nome]));
  const attivi = atleti.filter((a) => !a.archiviato).length;

  if (mancaTabella) {
    return (
      <div className="card">
        <h1>Diario allenamenti</h1>
        <p className="errore">Manca il diario nel database.</p>
        <p className="hint">In Supabase apri SQL Editor → New query, incolla il file <span className="num">supabase/migrations/0004_diario_allenamenti.sql</span> del repository e premi Run. Poi ricarica questa pagina.</p>
      </div>
    );
  }

  const questoMese = allenamenti.filter((a) => a.data.startsWith(meseCorrente()));
  const minutiMese = questoMese.reduce((s, a) => s + (a.durata_min ?? 0), 0);
  const presenzaMedia = questoMese.length && attivi
    ? Math.round((questoMese.reduce((s, a) => s + a.presenti.length, 0) / questoMese.length / attivi) * 100)
    : null;

  return (
    <>
      <div className="testata">
        <h1>Diario allenamenti</h1>
        {c.staff && <Link className="btn primary" href="/diario/nuovo">+ Nuovo allenamento</Link>}
      </div>

      {!allenamenti.length ? (
        <div className="list"><div className="empty">
          <b>Nessun allenamento registrato.</b>
          <p className="hint">{c.staff ? "Dopo ogni allenamento annota cosa avete fatto, gli argomenti e chi era presente." : "Qui compariranno gli allenamenti annotati dall'allenatore."}</p>
          {c.staff && <Link className="btn" href="/diario/nuovo">Registra il primo allenamento</Link>}
        </div></div>
      ) : (
        <>
          <div className="stats">
            <div className="stat"><span>Allenamenti questo mese</span><b>{questoMese.length}</b></div>
            <div className="stat"><span>Tempo questo mese</span><b>{formatoDurata(minutiMese) ?? "—"}</b></div>
            <div className="stat"><span>Presenza media</span><b>{presenzaMedia != null ? `${presenzaMedia}%` : "—"}</b><small>degli atleti attivi</small></div>
          </div>

          <ElencoDiario allenamenti={allenamenti} nomi={Object.fromEntries(nome)} staff={c.staff} meseCorrente={meseCorrente()} />
        </>
      )}
    </>
  );
}
