import { describe, expect, it } from "vitest";
import { media, ultimeDue, completaConPrecedenti } from "./valutazioni";
import { emailDaLogin, erroreLogin, generaPassword, loginDaEmail, MIN_PASSWORD, proponiNomeUtente } from "./credenziali";

describe("valutazioni", () => {
  it("media delle sole voci compilate e valide", () => {
    expect(media({ velocita: 7, tecnica: 8, tattica: 6.5 })).toBe(7.2);
    expect(media({ velocita: 7, inventata: 1, tecnica: 99 })).toBe(7);
    expect(media({})).toBeNull();
    expect(media(null)).toBeNull();
  });
  it("trova ultima e precedente per mese", () => {
    const v = (mese: string) => ({ id: mese, atleta_id: "x", mese, valori: {}, kata: {}, note: null });
    const { ultima, precedente } = ultimeDue([v("2026-10-01"), v("2026-08-01"), v("2026-09-01")]);
    expect([ultima?.mese, precedente?.mese]).toEqual(["2026-10-01", "2026-09-01"]);
  });
});

describe("credenziali atleti", () => {
  it("trasforma il nome utente in email interna e ritorno", () => {
    const e = emailDaLogin(" Luca.Ferrara ");
    expect(e).toBe("luca.ferrara@atleti.furinkazapp.local");
    expect(loginDaEmail(e)).toBe("luca.ferrara");
    expect(emailDaLogin("Mario@Gmail.com")).toBe("mario@gmail.com");
    expect(loginDaEmail("mario@gmail.com")).toBe("mario@gmail.com");
  });
  it("valida nome utente ed email", () => {
    expect(erroreLogin("luca.ferrara")).toBeNull();
    expect(erroreLogin("lu")).not.toBeNull();
    expect(erroreLogin("luca ferrara")).not.toBeNull();
    expect(erroreLogin("a@b.it")).toBeNull();
    expect(erroreLogin("a@b")).not.toBeNull();
  });
  it("propone un nome utente pulito", () => {
    expect(proponiNomeUtente("Niccolò D'Amico")).toBe("niccolo.d.amico");
  });
  it("genera password abbastanza lunghe", () => {
    for (let i = 0; i < 50; i++) expect(generaPassword().length).toBeGreaterThanOrEqual(MIN_PASSWORD);
  });
});


describe("conferma dei voti precedenti", () => {
  const precedenti: { mese: string; voti: Record<string, number> }[] = [
    { mese: "2026-09-01", voti: { velocita: 6, tecnica: 7, tattica: 5 } },
    { mese: "2026-10-01", voti: { velocita: 7, tecnica: 7.5 } },
  ];
  it("i campi vuoti prendono l'ultimo voto disponibile, voce per voce", () => {
    const r = completaConPrecedenti({ velocita: 8 }, ["velocita", "tecnica", "tattica", "calci"], precedenti);
    expect(r.valori).toEqual({ velocita: 8, tecnica: 7.5, tattica: 5 });
    expect(r.confermati).toEqual(["tecnica", "tattica"]);
  });
  it("senza storico non inventa nulla", () => {
    expect(completaConPrecedenti({ velocita: 8 }, ["velocita", "tecnica"], []).valori).toEqual({ velocita: 8 });
  });
});
