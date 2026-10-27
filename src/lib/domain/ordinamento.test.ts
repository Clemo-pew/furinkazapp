import { describe, expect, it } from "vitest";
import { cognomeDi, ordinaAtleti } from "./ordinamento";
import type { Atleta } from "./tipi";

const a = (nome: string, cintura: number, anno: number | null): Atleta =>
  ({ id: nome, dojo_id: "d", nome, sesso: "M", anno_nascita: anno, cintura, note: null, archiviato: false });

const lista = [a("Marco Bellini", 5, 2008), a("Luca De Rosa", 4, 2010), a("Anna Zanetti", 6, null), a("Giulia Russo", 4, 2009)];
const nomi = (l: Atleta[]) => l.map((x) => x.nome.split(" ")[0]);

describe("ordinamento squadra", () => {
  it("ricava il cognome, con le particelle", () => {
    expect(cognomeDi("Luca De Rosa")).toBe("De Rosa");
    expect(cognomeDi("Maria Grazia Rossi")).toBe("Rossi");
    expect(cognomeDi("Pietro")).toBe("Pietro");
  });
  it("per nome e cognome", () => {
    expect(nomi(ordinaAtleti(lista, "nome", "asc"))).toEqual(["Anna", "Giulia", "Luca", "Marco"]);
    expect(nomi(ordinaAtleti(lista, "cognome", "asc"))).toEqual(["Marco", "Luca", "Giulia", "Anna"]);
    expect(nomi(ordinaAtleti(lista, "cognome", "desc"))).toEqual(["Anna", "Giulia", "Luca", "Marco"]);
  });
  it("per cintura, dalla più alta; a parità per nome", () => {
    expect(nomi(ordinaAtleti(lista, "cintura", "desc"))).toEqual(["Anna", "Marco", "Giulia", "Luca"]);
  });
  it("per età, dal più giovane; senza anno in fondo", () => {
    expect(nomi(ordinaAtleti(lista, "eta", "asc"))).toEqual(["Luca", "Giulia", "Marco", "Anna"]);
    expect(nomi(ordinaAtleti(lista, "eta", "desc"))).toEqual(["Marco", "Giulia", "Luca", "Anna"]);
  });
});
