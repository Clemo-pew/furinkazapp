import { describe, expect, it } from "vitest";
import { analizzaDebolezze, debolezzaPrincipale, mappaColpi, statisticheKumite } from "./analisi";
import { puntiPer, risultato } from "./kumite";
import { ultimaVariazione, valorePrecedente } from "./misure";
import type { Incontro, Misura, Punto } from "./tipi";

const p = (o: number, lato: "aka" | "ao", tecnica: string, zona: Punto["zona"], parte: Punto["parte"] = "c", situazione: Punto["situazione"] = "attacco"): Punto =>
  ({ ordine: o, lato, tecnica, zona, parte, situazione, valore: puntiPer(tecnica, zona) });

const inc = (id: string, aka: string | null, ao: string | null, punti: Punto[]): Incontro =>
  ({ id, data: "2026-10-01", tipo: "allenamento", aka_atleta_id: aka, aka_nome: "A", ao_atleta_id: ao, ao_nome: "B", note: null, punti });

describe("punteggio WKF", () => {
  it("assegna Yuko, Waza-ari e Ippon", () => {
    expect(puntiPer("gyaku", "jodan")).toBe(1);
    expect(puntiPer("mawashi", "chudan")).toBe(2);
    expect(puntiPer("mawashi", "jodan")).toBe(3);
    expect(puntiPer("nage", "terra")).toBe(3);
  });
  it("a parità vince chi ha il senshu", () => {
    const r = risultato([p(0, "ao", "gyaku", "chudan"), p(1, "aka", "kizami", "jodan")]);
    expect(r).toMatchObject({ aka: 1, ao: 1, senshu: "ao", vincitore: "ao", perSenshu: true });
  });
  it("0 a 0 è pari", () => {
    expect(risultato([]).vincitore).toBeNull();
  });
});

describe("statistiche atleta", () => {
  const incontri = [
    inc("1", "luca", "marco", [p(0, "ao", "mawashi", "jodan", "sx", "contrattacco"), p(1, "aka", "gyaku", "chudan")]),
    inc("2", "marco", "luca", [p(0, "aka", "mawashi", "jodan", "sx", "contrattacco"), p(1, "aka", "kizami", "jodan", "sx")]),
    inc("3", "luca", null, [p(0, "aka", "gyaku", "chudan"), p(1, "ao", "mawashi", "jodan", "dx", "contrattacco"), p(2, "ao", "nage", "terra")]),
    inc("4", "altro", "marco", []),
  ];
  const s = statisticheKumite("luca", incontri);
  it("conta solo gli incontri dell'atleta, da entrambi i lati", () => {
    expect(s.incontri).toBe(3);
    expect([s.vinti, s.pari, s.persi]).toEqual([0, 0, 3]);
    expect(s.puntiFatti).toBe(2);
    expect(s.subiti).toHaveLength(5);
  });
  it("individua la debolezza principale", () => {
    const d = analizzaDebolezze(s.subiti)!;
    expect(d.tecnica).toEqual({ nome: "Mawashi-geri", percentuale: 60 });
    expect(d.zona?.nome).toBe("Jodan sinistro");
    expect(d.situazione.chiave).toBe("contrattacco");
    expect(debolezzaPrincipale(s.subiti)).toBe("Mawashi-geri jodan · 60%");
  });
  it("non conclude nulla con pochi dati", () => {
    expect(analizzaDebolezze(s.subiti.slice(0, 3))).toBeNull();
  });
  it("mappa le aree colpite", () => {
    expect(mappaColpi(s.subiti)).toEqual({ jodan_sx: 3, jodan_dx: 1, terra: 1 });
  });
});

describe("misure", () => {
  const m: Misura[] = [
    { id: "a", atleta_id: "x", mese: "2026-08-01", valori: { peso: 60, vita: 70 }, note: null },
    { id: "b", atleta_id: "x", mese: "2026-09-01", valori: { peso: 61.5 }, note: null },
    { id: "c", atleta_id: "x", mese: "2026-10-01", valori: { peso: 61 }, note: null },
  ];
  it("calcola la variazione sull'ultima rilevazione disponibile", () => {
    expect(ultimaVariazione(m, "peso")).toMatchObject({ valore: 61, delta: -0.5 });
    expect(ultimaVariazione(m, "vita")).toMatchObject({ valore: 70, delta: undefined });
  });
  it("trova il valore del mese precedente", () => {
    expect(valorePrecedente(m, "peso", "2026-10-01")).toBe(61.5);
    expect(valorePrecedente(m, "vita", "2026-10-01")).toBe(70);
  });
});
