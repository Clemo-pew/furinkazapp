import type { Ruolo } from "@/lib/domain/tipi";

// Voci del menu principale. Per aggiungere una sezione all'app:
// 1. crea la cartella in src/app/(app)/<sezione>/page.tsx
// 2. aggiungi qui la voce con i ruoli che possono vederla.
export interface VoceMenu {
  href: string;
  etichetta: string;
  ruoli: Ruolo[];
}

export const MENU: VoceMenu[] = [
  { href: "/squadra", etichetta: "Squadra", ruoli: ["admin", "istruttore", "atleta_plus", "atleta"] },
  { href: "/misure", etichetta: "Misure", ruoli: ["admin", "istruttore"] },
  { href: "/valutazioni", etichetta: "Valutazioni", ruoli: ["admin", "istruttore"] },
  { href: "/kumite", etichetta: "Kumite", ruoli: ["admin", "istruttore", "atleta_plus", "atleta"] },
  { href: "/diario", etichetta: "Diario", ruoli: ["admin", "istruttore", "atleta_plus", "atleta"] },
  { href: "/kata", etichetta: "Kata", ruoli: ["admin", "istruttore", "atleta_plus", "atleta"] },
  { href: "/impostazioni", etichetta: "Impostazioni", ruoli: ["admin", "istruttore"] },
];
