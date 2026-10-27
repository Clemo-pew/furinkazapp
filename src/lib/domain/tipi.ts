// Tipi condivisi che rispecchiano le tabelle del database (supabase/migrations).
// Se aggiungi una colonna in una migrazione, aggiungila anche qui.

export type Ruolo = "admin" | "istruttore" | "atleta";
export type Sesso = "M" | "F";
export type Lato = "aka" | "ao";
export type Zona = "jodan" | "chudan" | "terra";
export type Parte = "sx" | "c" | "dx";
export type Situazione = "attacco" | "contrattacco" | "anticipo";

export interface Dojo {
  id: string;
  nome: string;
}

export interface Atleta {
  id: string;
  dojo_id: string;
  nome: string;
  sesso: Sesso;
  anno_nascita: number | null;
  cintura: number;
  note: string | null;
  archiviato: boolean;
}

/** Una rilevazione mensile. `mese` è sempre il primo del mese (AAAA-MM-01). */
export interface Misura {
  id: string;
  atleta_id: string;
  mese: string;
  valori: Record<string, number>;
  note: string | null;
}

/** Valutazione tecnica mensile dell'allenatore (scala in domain/valutazioni.ts). */
export interface Valutazione {
  id: string;
  atleta_id: string;
  mese: string;
  valori: Record<string, number>;
  /** Voto di ogni kata valutato quel mese (chiavi in domain/kata.ts). */
  kata: Record<string, number>;
  note: string | null;
}

/** Un kata che l'atleta conosce, con la data in cui l'ha imparato (se nota). */
export interface KataConosciuto {
  atleta_id: string;
  kata: string;
  dal: string | null;
}

/** Una seduta del diario allenamenti. `presenti` sono gli id degli atleti presenti. */
export interface Allenamento {
  id: string;
  data: string;
  durata_min: number | null;
  argomenti: string[];
  titolo: string | null;
  descrizione: string;
  presenti: string[];
}

export interface Punto {
  ordine: number;
  lato: Lato;
  tecnica: string;
  zona: Zona;
  parte: Parte;
  situazione: Situazione;
  valore: number;
}

export interface Incontro {
  id: string;
  data: string;
  tipo: "allenamento" | "gara";
  aka_atleta_id: string | null;
  aka_nome: string;
  ao_atleta_id: string | null;
  ao_nome: string;
  note: string | null;
  punti: Punto[];
}
