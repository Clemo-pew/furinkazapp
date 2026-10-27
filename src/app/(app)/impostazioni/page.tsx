import type { Metadata } from "next";
import { contestoStaff } from "@/lib/data/contesto";
import { elencoAtleti } from "@/lib/data/query";
import { supabaseServer } from "@/lib/supabase/server";
import { dataIt } from "@/lib/domain/date";
import type { Ruolo } from "@/lib/domain/tipi";
import { FormInvito, FormNomeDojo, PulsanteElimina } from "./Moduli";
import { eliminaInvito, rimuoviMembro } from "./azioni";

export const metadata: Metadata = { title: "Impostazioni" };

const NOMI_RUOLO: Record<Ruolo, string> = { admin: "Amministratore", istruttore: "Istruttore", atleta: "Atleta" };

export default async function Impostazioni() {
  const c = await contestoStaff();
  const supabase = await supabaseServer();
  const [atleti, { data: membri }, { data: inviti }] = await Promise.all([
    elencoAtleti(c.dojo.id),
    supabase.from("membri").select("user_id, ruolo, atleta_id, created_at").eq("dojo_id", c.dojo.id).order("created_at"),
    supabase.from("inviti").select("codice, ruolo, atleta_id, scade_il, usato_il").eq("dojo_id", c.dojo.id).is("usato_da", null).order("created_at", { ascending: false }),
  ]);
  const { data: profili } = await supabase.from("profili").select("id, nome").in("id", (membri ?? []).map((m) => m.user_id));
  const nomeUtente = (id: string) => profili?.find((p) => p.id === id)?.nome || "Senza nome";
  const nomeAtleta = (id: string | null) => atleti.find((a) => a.id === id)?.nome;
  const collegati = new Set((membri ?? []).map((m) => m.atleta_id).filter(Boolean));
  const admin = c.ruolo === "admin";

  return (
    <>
      <h1>Impostazioni</h1>

      {admin && (
        <section className="card">
          <h3>Società</h3>
          <FormNomeDojo nome={c.dojo.nome} />
        </section>
      )}

      <section className="card">
        <h3>Invita qualcuno</h3>
        <p className="hint">
          Genera un codice e mandalo alla persona: crea il suo account e inserisce il codice al primo accesso.
          Un atleta vede solo la propria scheda, le proprie misure e i propri incontri. Il codice vale 14 giorni e si usa una volta.
        </p>
        <FormInvito admin={admin} atleti={atleti.filter((a) => !collegati.has(a.id)).map((a) => ({ id: a.id, nome: a.nome }))} />
        {!!inviti?.length && (
          <div className="stack-s">
            <h3>Codici non ancora usati</h3>
            {inviti.map((i) => (
              <div className="bar" key={i.codice} style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                <b className="num" style={{ letterSpacing: ".08em" }}>{i.codice}</b>
                <span className="grow hint">
                  {NOMI_RUOLO[i.ruolo as Ruolo]}{i.atleta_id && ` · ${nomeAtleta(i.atleta_id) ?? "atleta"}`} · scade il {dataIt(i.scade_il.slice(0, 10))}
                </span>
                <PulsanteElimina azione={eliminaInvito.bind(null, i.codice)} testo="Annulla" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h3>Persone con accesso</h3>
        {(membri ?? []).map((m) => (
          <div className="bar" key={m.user_id} style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            <span className="grow">
              <b>{nomeUtente(m.user_id)}</b>{m.user_id === c.userId && " (tu)"}
              <br /><span className="hint">{NOMI_RUOLO[m.ruolo as Ruolo]}{m.atleta_id && ` · scheda di ${nomeAtleta(m.atleta_id) ?? "atleta"}`}</span>
            </span>
            {admin && m.user_id !== c.userId && <PulsanteElimina azione={rimuoviMembro.bind(null, m.user_id)} testo="Togli accesso" />}
          </div>
        ))}
      </section>
    </>
  );
}
