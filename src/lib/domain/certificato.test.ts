import { describe, expect, it } from "vitest";
import { descriviScadenza, giorniAllaScadenza, statoCertificato, tipoValido } from "./certificato";

describe("certificato medico", () => {
  const oggi = "2026-11-01";
  it("calcola lo stato rispetto a oggi", () => {
    expect(statoCertificato("2027-03-31", oggi)).toBe("valido");
    expect(statoCertificato("2026-12-01", oggi)).toBe("in_scadenza"); // 30 giorni
    expect(statoCertificato("2026-12-02", oggi)).toBe("valido"); // 31 giorni
    expect(statoCertificato("2026-11-01", oggi)).toBe("in_scadenza"); // scade oggi: ancora valido
    expect(statoCertificato("2026-10-31", oggi)).toBe("scaduto");
    expect(statoCertificato(null, oggi)).toBe("mancante");
  });
  it("conta i giorni anche a cavallo dell'ora legale e dell'anno", () => {
    expect(giorniAllaScadenza("2027-01-01", "2026-12-31")).toBe(1);
    expect(giorniAllaScadenza("2027-03-29", "2027-03-27")).toBe(2);
  });
  it("descrive la scadenza", () => {
    expect(descriviScadenza("2026-11-13", oggi)).toBe("Scade tra 12 giorni");
    expect(descriviScadenza("2026-11-01", oggi)).toBe("Scade oggi");
    expect(descriviScadenza("2026-10-29", oggi)).toBe("Scaduto da 3 giorni");
  });
  it("accetta solo i due tipi", () => {
    expect(tipoValido("agonistico") && tipoValido("non_agonistico")).toBe(true);
    expect(tipoValido("sportivo")).toBe(false);
  });
});
