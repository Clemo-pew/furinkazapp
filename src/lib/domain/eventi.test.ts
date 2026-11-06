import { describe, expect, it } from "vitest";
import { dateEvento, eventoNelGiorno, eventiFuturi, grigliaMese, promemoria, quandoEvento, spostaMese } from "./eventi";
import type { Evento } from "./tipi";

const ev = (id: string, data_inizio: string, data_fine: string | null = null, ora: string | null = null): Evento =>
  ({ id, titolo: id, tipo: "gara", data_inizio, data_fine, ora, luogo: null, descrizione: null, link: null });

describe("eventi", () => {
  const oggi = "2026-11-06";
  const lista = [ev("passato", "2026-11-01"), ev("in-corso", "2026-11-05", "2026-11-07"), ev("tra-14", "2026-11-20"), ev("tra-15", "2026-11-21"), ev("oggi", "2026-11-06", null, "18:00")];

  it("promemoria: in corso e fino a 14 giorni, dal più vicino", () => {
    expect(promemoria(lista, oggi).map((e) => e.id)).toEqual(["in-corso", "oggi", "tra-14"]);
  });
  it("futuri: esclude solo quelli finiti", () => {
    expect(eventiFuturi(lista, oggi).map((e) => e.id)).toEqual(["in-corso", "oggi", "tra-14", "tra-15"]);
  });
  it("quando", () => {
    expect(quandoEvento(ev("x", "2026-11-05", "2026-11-07"), oggi)).toBe("In corso");
    expect(quandoEvento(ev("x", "2026-11-06"), oggi)).toBe("Oggi");
    expect(quandoEvento(ev("x", "2026-11-07"), oggi)).toBe("Domani");
    expect(quandoEvento(ev("x", "2026-11-20"), oggi)).toBe("Tra 14 giorni");
  });
  it("eventi su più giorni", () => {
    expect(eventoNelGiorno(ev("x", "2026-11-05", "2026-11-07"), "2026-11-06")).toBe(true);
    expect(eventoNelGiorno(ev("x", "2026-11-05", "2026-11-07"), "2026-11-08")).toBe(false);
  });
  it("griglia del mese da lunedì a domenica", () => {
    const g = grigliaMese("2026-11"); // 1 novembre 2026 è domenica
    expect(g[0][0]).toEqual({ data: "2026-10-26", delMese: false });
    expect(g[0][6]).toEqual({ data: "2026-11-01", delMese: true });
    expect(g.at(-1)!.at(-1)!.data).toBe("2026-12-06");
    expect(g.every((s) => s.length === 7)).toBe(true);
    expect(grigliaMese("2027-02").length).toBe(4); // febbraio 2027 parte di lunedì e finisce di domenica
  });
  it("sposta mese a cavallo d'anno", () => {
    expect(spostaMese("2026-01", -1)).toBe("2025-12");
    expect(spostaMese("2026-12", 1)).toBe("2027-01");
  });
  it("date leggibili", () => {
    expect(dateEvento(ev("x", "2026-11-14", null, "09:30"))).toBe("sab 14 nov · 09:30");
    expect(dateEvento(ev("x", "2026-11-14", "2026-11-15"))).toBe("sab 14 nov – dom 15 nov");
  });
});
