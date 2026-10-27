"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NOMI_PUNTEGGIO, PARTI, puntiPer, risultato, SITUAZIONI, TECNICHE, tipoTecnica } from "@/lib/domain/kumite";
import type { Lato, Parte, Situazione, Zona } from "@/lib/domain/tipi";
import { ElencoPunti } from "@/components/ElencoPunti";
import { salvaIncontro, type NuovoIncontro } from "../azioni";

type Lati = { atletaId: string | null; nome: string; esterno: boolean };
type Bozza = { lato: Lato; tecnica: string; zona: Zona; parte: Parte; situazione: Situazione };

const CHIAVE_BOZZA = "registro-dojo:incontro-in-corso";

/** Tabellone per registrare un incontro punto per punto. La bozza resta nel browser se la pagina si chiude. */
export function Registrazione({ atleti, oggi }: { atleti: { id: string; nome: string }[]; oggi: string }) {
  const router = useRouter();
  const vuoto: Lati = { atletaId: null, nome: "", esterno: false };
  const [data, setData] = useState(oggi);
  const [tipo, setTipo] = useState<"allenamento" | "gara">("allenamento");
  const [aka, setAka] = useState<Lati>(vuoto);
  const [ao, setAo] = useState<Lati>(vuoto);
  const [note, setNote] = useState("");
  const [punti, setPunti] = useState<Bozza[]>([]);
  const [pannello, setPannello] = useState<Bozza | null>(null);
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, avvia] = useTransition();

  // ripristina e salva la bozza
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem(CHIAVE_BOZZA) ?? "null");
      if (b) { setData(b.data); setTipo(b.tipo); setAka(b.aka); setAo(b.ao); setNote(b.note); setPunti(b.punti); }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CHIAVE_BOZZA, JSON.stringify({ data, tipo, aka, ao, note, punti })); } catch {}
  }, [data, tipo, aka, ao, note, punti]);

  const conValore = punti.map((p, i) => ({ ...p, ordine: i, valore: puntiPer(p.tecnica, p.zona) }));
  const r = risultato(conValore);
  const pronto = Boolean(aka.nome.trim() && ao.nome.trim());

  function scegli(set: (l: Lati) => void, valore: string) {
    if (valore === "__esterno") set({ atletaId: null, nome: "", esterno: true });
    else set({ atletaId: valore || null, nome: atleti.find((a) => a.id === valore)?.nome ?? "", esterno: false });
  }

  function salva() {
    setErrore(null);
    const payload: NuovoIncontro = {
      data, tipo, note,
      aka: { atletaId: aka.atletaId, nome: aka.nome },
      ao: { atletaId: ao.atletaId, nome: ao.nome },
      punti,
    };
    avvia(async () => {
      const esito = await salvaIncontro(payload);
      if (esito.errore) return setErrore(esito.errore);
      try { localStorage.removeItem(CHIAVE_BOZZA); } catch {}
      router.push("/kumite");
    });
  }

  function scarta() {
    if (!conferma) return setConferma(true);
    try { localStorage.removeItem(CHIAVE_BOZZA); } catch {}
    router.push("/kumite");
  }

  const lato = (l: Lato, val: Lati, set: (x: Lati) => void, altro: Lati) => (
    <div className={`bside ${l}`}>
      <span className="tag">{l.toUpperCase()}</span>
      <select id={`sel-${l}`} aria-label={`Atleta ${l.toUpperCase()}`}
        value={val.esterno ? "__esterno" : val.atletaId ?? ""} onChange={(e) => scegli(set, e.target.value)}>
        <option value="">Scegli…</option>
        {atleti.map((a) => <option key={a.id} value={a.id} disabled={altro.atletaId === a.id}>{a.nome}</option>)}
        <option value="__esterno">Esterno (altra società)</option>
      </select>
      {val.esterno && (
        <input id={`est-${l}`} placeholder="Nome avversario" maxLength={60} value={val.nome}
          onChange={(e) => set({ ...val, nome: e.target.value })} />
      )}
      <div className="bar" style={{ justifyContent: "space-between" }}>
        <span className="score">{l === "aka" ? r.aka : r.ao}</span>
        {r.senshu === l && <span className="senshu">Senshu</span>}
      </div>
      <button type="button" className={`btn ${l}`}
        onClick={() => setPannello({ lato: l, tecnica: "gyaku", zona: "chudan", parte: "c", situazione: "attacco" })}>
        + Punto {l.toUpperCase()}
      </button>
    </div>
  );

  const opzione = (attivo: boolean, testo: string, onClick: () => void) => (
    <button type="button" className="opt" aria-pressed={attivo} onClick={onClick} key={testo}>{testo}</button>
  );

  return (
    <>
      <div className="testata">
        <h1>Nuovo incontro</h1>
        <div className="bar">
          <select id="tipo" aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} style={{ width: "auto" }}>
            <option value="allenamento">Allenamento</option>
            <option value="gara">Gara</option>
          </select>
          <input id="data" type="date" aria-label="Data" value={data} onChange={(e) => setData(e.target.value || oggi)} style={{ width: "auto" }} />
        </div>
      </div>

      <div className="board">{lato("aka", aka, setAka, ao)}{lato("ao", ao, setAo, aka)}</div>

      {pannello && (() => {
        const P = pannello;
        const tipoT = tipoTecnica(P.tecnica);
        const v = puntiPer(P.tecnica, P.zona);
        const set = (x: Partial<Bozza>) => setPannello({ ...P, ...x });
        return (
          <div className="panel">
            <h3 className={`t-${P.lato}`}>Punto {P.lato.toUpperCase()}{(P.lato === "aka" ? aka : ao).nome && ` · ${(P.lato === "aka" ? aka : ao).nome}`}</h3>
            <div className="stack-s"><h3>Tecnica</h3><div className="seg">
              {Object.entries(TECNICHE).map(([k, t]) => opzione(P.tecnica === k, t.nome, () => {
                if (t.tipo === "nage") set({ tecnica: k, zona: "terra", parte: "c" });
                else set({ tecnica: k, zona: k === "ura" ? "jodan" : P.zona === "terra" ? "chudan" : P.zona });
              }))}
            </div></div>
            {tipoT !== "nage" && (
              <>
                <div className="stack-s"><h3>Zona</h3><div className="seg">
                  {opzione(P.zona === "jodan", "Jodan (testa)", () => set({ zona: "jodan" }))}
                  {opzione(P.zona === "chudan", "Chudan (busto)", () => set({ zona: "chudan" }))}
                </div></div>
                <div className="stack-s"><h3>Lato colpito (di chi subisce)</h3><div className="seg">
                  {(Object.entries(PARTI) as [Parte, string][]).map(([k, n]) => opzione(P.parte === k, n, () => set({ parte: k })))}
                </div></div>
              </>
            )}
            <div className="stack-s"><h3>Situazione (di chi segna)</h3><div className="seg">
              {(Object.entries(SITUAZIONI) as [Situazione, string][]).map(([k, n]) => opzione(P.situazione === k, n, () => set({ situazione: k })))}
            </div></div>
            <div className="bar">
              <span className="num grow">= {NOMI_PUNTEGGIO[v]} · {v} punt{v > 1 ? "i" : "o"}</span>
              <button type="button" className="btn small" onClick={() => setPannello(null)}>Annulla</button>
              <button type="button" className="btn small primary" onClick={() => { setPunti([...punti, P]); setPannello(null); }}>Aggiungi punto</button>
            </div>
          </div>
        );
      })()}

      <div className="card">
        <h3>Punti registrati</h3>
        <ElencoPunti punti={conValore} onElimina={(i) => setPunti(punti.filter((_, k) => k !== i))} />
        <label className="campo">Note<textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Facoltative: condizioni, avversario, osservazioni…" /></label>
      </div>

      {errore && <p className="errore" role="alert">{errore}</p>}
      <div className="bar">
        <button type="button" className="btn danger" onClick={scarta}>{conferma ? "Conferma: scarta" : "Scarta"}</button>
        <span className="grow" />
        <button type="button" className="btn primary" disabled={!pronto || attesa} onClick={salva}>{attesa ? "Salvataggio…" : "Salva incontro"}</button>
      </div>
      {!pronto && <p className="hint">Scegli i due atleti per poter salvare. L&apos;incontro in corso resta salvato su questo dispositivo finché non lo salvi o lo scarti.</p>}
    </>
  );
}
