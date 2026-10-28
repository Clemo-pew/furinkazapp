import type { Ruolo } from "./tipi";

// Ruoli dell'app, in un solo posto: nomi mostrati e cosa può fare ciascuno.
// "atleta" e "atleta_plus" sono i valori salvati nel database (tabella membri);
// nell'app si chiamano Allievo e Allievo+.
export const RUOLI: { chiave: Ruolo; nome: string; descrizione: string }[] = [
  { chiave: "admin", nome: "Amministratore", descrizione: "Gestisce tutto, crea gli accessi e cambia i ruoli." },
  { chiave: "istruttore", nome: "Istruttore", descrizione: "Inserisce e modifica atleti, misure, valutazioni, incontri e diario." },
  { chiave: "atleta_plus", nome: "Allievo+", descrizione: "Vede tutta la squadra, comprese le valutazioni. Inserisce solo le proprie misure." },
  { chiave: "atleta", nome: "Allievo", descrizione: "Vede la squadra, gli incontri e il diario, ma nessun voto. Inserisce solo le proprie misure." },
];

export const nomeRuolo = (r: Ruolo) => RUOLI.find((x) => x.chiave === r)?.nome ?? r;

/** Ruoli di chi è collegato a una scheda atleta (non modifica nulla). */
export const RUOLI_ALLIEVO: Ruolo[] = ["atleta", "atleta_plus"];
export const isAllievo = (r: Ruolo) => RUOLI_ALLIEVO.includes(r);
export const isStaff = (r: Ruolo) => r === "admin" || r === "istruttore";
/** Chi vede i voti delle valutazioni (generali e dei kata). */
export const vedeValutazioni = (r: Ruolo) => isStaff(r) || r === "atleta_plus";
export const ruoloValido = (r: string): r is Ruolo => RUOLI.some((x) => x.chiave === r);
