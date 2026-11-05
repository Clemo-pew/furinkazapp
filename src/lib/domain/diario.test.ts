import { describe, expect, it } from "vitest";
import { etichettaSettimana, formatoDurata, giornoSettimana, inizioSettimana, perMese, perSettimana, presenzeAtleta, titoloBreve } from "./diario";
import type { Allenamento } from "./tipi";

const all = (id: string, data: string, presenti: string[]): Allenamento =>
  ({ id, data, durata_min: 90, argomenti: [], titolo: null, descrizione: "", presenti });

describe("diario allenamenti", () => {
  it("formatta la durata", () => {
    expect(formatoDurata(90)).toBe("1 h 30 min");
    expect(formatoDurata(60)).toBe("1 h");
    expect(formatoDurata(45)).toBe("45 min");
    expect(formatoDurata(null)).toBeNull();
  });
  it("nome del giorno", () => {
    expect(giornoSettimana("2026-10-27")).toBe("martedì 27");
  });
  it("conta le presenze recenti e totali", () => {
    const lista = [all("1", "2026-10-26", ["luca"]), all("2", "2026-10-20", []), all("3", "2026-08-01", ["luca"])];
    expect(presenzeAtleta("luca", lista, "2026-10-27")).toEqual({ totale: 2, recenti: 1, recentiSvolti: 2 });
  });
  it("raggruppa per mese", () => {
    const g = perMese([all("1", "2026-10-26", []), all("2", "2026-10-02", []), all("3", "2026-09-30", [])]);
    expect(g.map(([m, l]) => [m, l.length])).toEqual([["2026-10", 2], ["2026-09", 1]]);
  });
});


describe("settimane del diario", () => {
  it("trova il lunedì della settimana", () => {
    expect(inizioSettimana("2026-11-05")).toBe("2026-11-02"); // giovedì
    expect(inizioSettimana("2026-11-08")).toBe("2026-11-02"); // domenica
    expect(inizioSettimana("2026-11-02")).toBe("2026-11-02"); // lunedì
    expect(inizioSettimana("2026-11-01")).toBe("2026-10-26"); // domenica del mese prima
  });
  it("scrive l'intervallo della settimana", () => {
    expect(etichettaSettimana("2026-11-02")).toBe("2–8 nov");
    expect(etichettaSettimana("2026-10-26")).toBe("26 ott – 1 nov");
    expect(etichettaSettimana("2026-12-28")).toBe("28 dic – 3 gen");
  });
  it("raggruppa per settimana", () => {
    const g = perSettimana([all("1", "2026-11-05", []), all("2", "2026-11-03", []), all("3", "2026-10-29", [])]);
    expect(g.map(([s, l]) => [s, l.length])).toEqual([["2026-11-02", 2], ["2026-10-26", 1]]);
  });
  it("titolo breve", () => {
    expect(titoloBreve({ ...all("1", "2026-11-05", []), titolo: "Uscite laterali" })).toBe("Uscite laterali");
    expect(titoloBreve({ ...all("1", "2026-11-05", []), argomenti: ["kihon", "kumite"] })).toBe("Kihon · Kumite");
    expect(titoloBreve({ ...all("1", "2026-11-05", []), descrizione: "\nRiscaldamento e kihon\naltro" })).toBe("Riscaldamento e kihon");
    expect(titoloBreve(all("1", "2026-11-05", []))).toBe("Allenamento");
  });
});
