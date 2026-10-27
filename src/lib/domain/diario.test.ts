import { describe, expect, it } from "vitest";
import { formatoDurata, giornoSettimana, perMese, presenzeAtleta } from "./diario";
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
