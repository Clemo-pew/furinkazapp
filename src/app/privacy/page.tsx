import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigurato } from "@/lib/supabase/config";
import { TITOLARE } from "@/lib/privacy";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Privacy" };

/** Nome della società se l'utente è collegato (la pagina è visibile anche senza accesso). */
async function nomeDojo(): Promise<string | null> {
  if (!supabaseConfigurato) return null;
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.from("membri").select("dojos(nome)").limit(1).maybeSingle();
    return (data?.dojos as unknown as { nome: string } | null)?.nome ?? null;
  } catch {
    return null;
  }
}

export default async function Privacy() {
  const dojo = await nomeDojo();
  const titolare = TITOLARE.denominazione || dojo || "l'associazione sportiva che ti ha dato accesso all'app";
  const contatto = TITOLARE.contatto
    ? <>scrivendo a <b>{TITOLARE.contatto}</b></>
    : <>rivolgendoti alla segreteria dell&apos;associazione o al tuo allenatore</>;

  return (
    <main className="wrap" style={{ paddingBlock: "24px 64px" }}>
      <article className="stack privacy">
        <Link href="/" style={{ textDecoration: "none" }}><Logo altezza={30} /></Link>
        <div className="stack-s">
          <h1>Informativa sulla privacy</h1>
          <p className="hint">Ultimo aggiornamento: {TITOLARE.aggiornata}</p>
        </div>

        <p>
          Questa pagina spiega quali dati raccoglie FurinkazApp, a cosa servono, chi può vederli e quali sono i tuoi diritti,
          ai sensi del Regolamento UE 2016/679 (GDPR) e del Codice privacy (D.Lgs. 196/2003).
        </p>

        <section className="stack-s">
          <h2>Chi tratta i dati</h2>
          <p>
            Il titolare del trattamento è <b>{titolare}</b>{TITOLARE.sede && <>, con sede in {TITOLARE.sede}</>}.
            Per qualsiasi richiesta sulla privacy puoi contattarlo {contatto}.
          </p>
        </section>

        <section className="stack-s">
          <h2>Quali dati raccogliamo</h2>
          <ul>
            <li><b>Dati anagrafici e sportivi</b>: nome e cognome, sesso, anno di nascita, cintura, eventuali note dell&apos;allenatore.</li>
            <li><b>Misure fisiche</b>: peso, altezza, massa grassa, circonferenze, rilevate mese per mese.</li>
            <li><b>Certificato medico</b>: solo il tipo (agonistico o non agonistico) e la data di scadenza. Non conserviamo il certificato né diagnosi.</li>
            <li><b>Valutazioni tecniche</b> dell&apos;allenatore, kata conosciuti e relativi voti.</li>
            <li><b>Allenamenti e incontri</b>: presenze, incontri di kumite in allenamento con i punti segnati e subiti.</li>
            <li><b>Dati di accesso</b>: nome utente (o email, se l&apos;hai indicata tu) e password, conservata in forma cifrata.</li>
          </ul>
          <p>Non raccogliamo codice fiscale, indirizzo di residenza, numero di telefono né fotografie.</p>
        </section>

        <section className="stack-s">
          <h2>Perché li usiamo</h2>
          <p>
            Per seguire la preparazione degli atleti: monitorare la condizione fisica, valutare i progressi tecnici,
            analizzare il kumite, organizzare allenamenti ed eventi e verificare che il certificato medico sia in corso di validità.
            I dati non sono usati per pubblicità, non sono venduti e non sono ceduti a terzi.
          </p>
          <p>
            La base giuridica è il rapporto associativo e sportivo con l&apos;associazione. Per le misure fisiche e il certificato medico,
            che possono riguardare la salute, il trattamento avviene con il tuo consenso esplicito o, per i minori, con quello di chi esercita la responsabilità genitoriale.
          </p>
        </section>

        <section className="stack-s">
          <h2>Chi può vedere cosa</h2>
          <div className="tbl">
            <table style={{ minWidth: 520 }}>
              <thead>
                <tr><th>Dato</th><th>Allenatori e istruttori</th><th>Il diretto interessato</th><th>Gli altri allievi</th></tr>
              </thead>
              <tbody>
                <tr><td>Nome, cintura, età</td><td>Sì</td><td>Sì</td><td>Sì</td></tr>
                <tr><td>Misure fisiche</td><td>Sì</td><td>Sì</td><td>No</td></tr>
                <tr><td>Certificato medico</td><td>Sì</td><td>Sì</td><td>No</td></tr>
                <tr><td>Valutazioni e voti dei kata</td><td>Sì</td><td>Solo se «Allievo+»</td><td>Solo se «Allievo+»</td></tr>
                <tr><td>Incontri di kumite, presenze, kata conosciuti</td><td>Sì</td><td>Sì</td><td>Sì</td></tr>
                <tr><td>Note dell&apos;allenatore</td><td>Sì</td><td>No</td><td>No</td></tr>
              </tbody>
            </table>
          </div>
          <p className="hint">Modificano i dati solo allenatori e istruttori. Ogni allievo può inserire e correggere soltanto le proprie misure.</p>
        </section>

        <section className="stack-s">
          <h2>Dove sono conservati</h2>
          <p>
            I dati sono conservati nel database del servizio Supabase, in un centro dati situato in {TITOLARE.regioneDati}.
            L&apos;app è pubblicata tramite il servizio Vercel, con elaborazione a Francoforte.
            Entrambi i fornitori agiscono come responsabili del trattamento secondo i rispettivi accordi sul trattamento dei dati (DPA).
            Le comunicazioni tra il tuo dispositivo e l&apos;app sono cifrate (HTTPS).
          </p>
        </section>

        <section className="stack-s">
          <h2>Per quanto tempo</h2>
          <p>
            Conserviamo i dati finché sei iscritto all&apos;associazione. Quando smetti di allenarti la tua scheda può essere archiviata
            e, su tua richiesta o al termine del periodo necessario, cancellata: la cancellazione elimina anche misure, valutazioni e certificato.
          </p>
        </section>

        <section className="stack-s">
          <h2>Minori</h2>
          <p>
            Per gli atleti minorenni i dati sono raccolti con il consenso dei genitori o di chi ne esercita la responsabilità genitoriale.
            Sotto i 14 anni l&apos;accesso all&apos;app viene creato solo con il loro consenso.
          </p>
        </section>

        <section className="stack-s">
          <h2>Cookie</h2>
          <p>
            L&apos;app usa solo cookie tecnici, necessari per mantenere l&apos;accesso e ricordare la società selezionata.
            Non usiamo cookie di profilazione né strumenti di statistica. I video dei kata vengono caricati da YouTube
            (in modalità senza cookie di tracciamento) solo quando tocchi il video per guardarlo.
          </p>
        </section>

        <section className="stack-s">
          <h2>I tuoi diritti</h2>
          <p>
            Puoi chiedere in qualsiasi momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne l&apos;uso,
            riceverne una copia o revocare il consenso, {contatto}. Hai anche il diritto di presentare reclamo al
            Garante per la protezione dei dati personali (garanteprivacy.it).
          </p>
        </section>

        <p className="hint"><Link href="/">← Torna all&apos;app</Link></p>
      </article>
    </main>
  );
}
