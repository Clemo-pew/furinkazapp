import { describe, expect, it } from "vitest";
import { isAllievo, isStaff, nomeRuolo, ruoloValido, vedeValutazioni } from "./ruoli";

describe("ruoli", () => {
  it("solo staff e Allievo+ vedono le valutazioni", () => {
    expect(vedeValutazioni("admin")).toBe(true);
    expect(vedeValutazioni("istruttore")).toBe(true);
    expect(vedeValutazioni("atleta_plus")).toBe(true);
    expect(vedeValutazioni("atleta")).toBe(false);
  });
  it("classifica i ruoli", () => {
    expect(isAllievo("atleta_plus") && isAllievo("atleta")).toBe(true);
    expect(isStaff("atleta_plus")).toBe(false);
    expect(nomeRuolo("atleta")).toBe("Allievo");
    expect(nomeRuolo("atleta_plus")).toBe("Allievo+");
    expect(ruoloValido("superuser")).toBe(false);
  });
});
