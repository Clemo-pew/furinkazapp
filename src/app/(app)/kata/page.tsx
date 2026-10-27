import type { Metadata } from "next";
import { contesto } from "@/lib/data/contesto";
import { kataConosciuti, videoKataDelDojo } from "@/lib/data/query";
import { GRUPPI_KATA, KATA } from "@/lib/domain/kata";
import { VIDEO_PREDEFINITI, videoKata } from "@/lib/domain/kataVideo";
import { VideoYoutube } from "@/components/VideoYoutube";
import { GestioneVideo } from "./GestioneVideo";

export const metadata: Metadata = { title: "Kata" };

const DESCRIZIONE_GRUPPO: Record<(typeof GRUPPI_KATA)[number], string> = {
  Heian: "I cinque kata di base.",
  Tekki: "Kata in kiba-dachi, su una linea.",
  Superiori: "Kata superiori dello Shotokan.",
};

export default async function PaginaKata() {
  const c = await contesto();
  const [personalizzati, conosciuti] = await Promise.all([
    videoKataDelDojo(c.dojo.id),
    c.atletaId ? kataConosciuti(c.dojo.id, c.atletaId) : Promise.resolve([]),
  ]);
  const miei = new Set(conosciuti.map((k) => k.kata));
  const conVideo = KATA.filter((k) => videoKata(k.chiave, personalizzati)).length;

  return (
    <>
      <div className="stack-s">
        <h1>Kata · Shotokan</h1>
        <p className="hint">
          Esecuzione di ogni kata. Tocca un video per guardarlo qui, oppure aprilo su YouTube.
          {c.staff && ` ${conVideo} kata su ${KATA.length} hanno un video: per gli altri usa «Aggiungi video» e incolla un link YouTube.`}
        </p>
        {miei.size > 0 && (
          <nav className="seg" aria-label="I miei kata">
            <span className="hint">I tuoi kata:</span>
            {KATA.filter((k) => miei.has(k.chiave)).map((k) => (
              <a key={k.chiave} href={`#${k.chiave}`} className="opt" style={{ textDecoration: "none" }}>{k.nome}</a>
            ))}
          </nav>
        )}
      </div>

      {GRUPPI_KATA.map((g) => (
        <section className="stack-s" key={g}>
          <h2>{g}</h2>
          <p className="hint">{DESCRIZIONE_GRUPPO[g]}</p>
          <div className="griglia-kata">
            {KATA.filter((k) => k.gruppo === g).map((k) => {
              const v = videoKata(k.chiave, personalizzati);
              return (
                <article className="card" key={k.chiave} id={k.chiave} style={{ scrollMarginTop: 120 }}>
                  <div className="testata">
                    <b>{k.nome}</b>
                    {miei.has(k.chiave) && <span className="badge-conosci">Lo conosci</span>}
                  </div>
                  {v ? (
                    <VideoYoutube id={v.id} titolo={`${k.nome} – esecuzione`} />
                  ) : (
                    <div className="video-vuoto hint">Video non ancora disponibile.</div>
                  )}
                  {c.staff && (
                    <GestioneVideo kata={k.chiave} haVideo={Boolean(v)} personalizzato={Boolean(v?.personalizzato)} haPredefinito={Boolean(VIDEO_PREDEFINITI[k.chiave])} />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <p className="hint">
        Video predefiniti: Shotokan Karate Academy (Vancouver), dalle pagine dei kata del loro sito.
        I video aggiunti o cambiati dallo staff valgono solo per il nostro dojo.
      </p>
    </>
  );
}
