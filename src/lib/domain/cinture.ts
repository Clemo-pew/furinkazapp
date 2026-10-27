// Gradi in ordine: l'indice è il valore salvato nella colonna atleti.cintura (0–10).
// Per cambiare i nomi o i colori basta modificare qui; non cambiare l'ordine dei gradi esistenti.
export const CINTURE = [
  { nome: "Bianca", colore: "#FFFFFF" },
  { nome: "Gialla", colore: "#F5D21F" },
  { nome: "Arancione", colore: "#F08A1C" },
  { nome: "Verde", colore: "#2E9E48" },
  { nome: "Blu", colore: "#2456C7" },
  { nome: "Marrone", colore: "#6B3F1E" },
  { nome: "Nera 1° Dan", colore: "#0B0B0B" },
  { nome: "Nera 2° Dan", colore: "#0B0B0B" },
  { nome: "Nera 3° Dan", colore: "#0B0B0B" },
  { nome: "Nera 4° Dan", colore: "#0B0B0B" },
  { nome: "Nera 5° Dan", colore: "#0B0B0B" },
] as const;

export const cintura = (i: number) => CINTURE[Math.max(0, Math.min(CINTURE.length - 1, i))];
