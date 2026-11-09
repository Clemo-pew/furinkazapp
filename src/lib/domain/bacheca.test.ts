import { describe, expect, it } from "vitest";
import { dividiBacheca, perLaHome } from "./bacheca";
import type { Comunicazione } from "./tipi";

const c = (id: string, created_at: string, in_evidenza = false, scade_il: string | null = null): Comunicazione =>
  ({ id, titolo: id, testo: "", in_evidenza, scade_il, autore_nome: null, created_at });

describe("bacheca", () => {
  const oggi = "2026-11-10";
  const lista = [
    c("vecchia", "2026-10-01T10:00:00Z"),
    c("recente", "2026-11-08T10:00:00Z"),
    c("fissata-vecchia", "2026-09-01T10:00:00Z", true),
    c("scaduta", "2026-11-09T10:00:00Z", true, "2026-11-09"),
    c("scade-oggi", "2026-11-05T10:00:00Z", false, "2026-11-10"),
  ];
  it("home: fissate attive prima, poi le recenti; niente scadute o vecchie", () => {
    expect(perLaHome(lista, oggi).map((x) => x.id)).toEqual(["fissata-vecchia", "recente", "scade-oggi"]);
  });
  it("bacheca: attuali e passate", () => {
    const { attuali, passate } = dividiBacheca(lista, oggi);
    expect(attuali.map((x) => x.id)).toEqual(["fissata-vecchia", "recente", "scade-oggi", "vecchia"]);
    expect(passate.map((x) => x.id)).toEqual(["scaduta"]);
  });
});
