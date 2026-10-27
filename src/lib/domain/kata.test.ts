import { describe, expect, it } from "vitest";
import { KATA, kataValido, mediaKata, ordinaKata, storicoKata } from "./kata";

describe("kata", () => {
  it("chiavi uniche e valide per il database", () => {
    const chiavi = KATA.map((k) => k.chiave);
    expect(new Set(chiavi).size).toBe(chiavi.length);
    for (const k of chiavi) expect(k).toMatch(/^[a-z0-9_]{2,40}$/);
  });
  it("ordina per ordine di apprendimento", () => {
    expect(ordinaKata(["bassai_dai", "heian_nidan", "tekki_shodan", "heian_shodan"])).toEqual(["heian_shodan", "heian_nidan", "tekki_shodan", "bassai_dai"]);
  });
  it("media solo dei kata validi", () => {
    expect(mediaKata({ heian_shodan: 7, heian_nidan: 8, inventato: 1 })).toBe(7.5);
    expect(mediaKata({})).toBeNull();
    expect(kataValido("enpi")).toBe(true);
  });
  it("storico di un kata nel tempo", () => {
    const v = (mese: string, kata: Record<string, number>) => ({ id: mese, atleta_id: "x", mese, valori: {}, kata, note: null });
    expect(storicoKata([v("2026-10-01", { enpi: 8 }), v("2026-08-01", { enpi: 6 }), v("2026-09-01", {})], "enpi"))
      .toEqual([{ mese: "2026-08-01", voto: 6 }, { mese: "2026-10-01", voto: 8 }]);
  });
});
