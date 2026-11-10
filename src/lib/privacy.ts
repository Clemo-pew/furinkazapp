// Dati dell'associazione per la pagina Privacy (/privacy).
// Da completare a cura del titolare: se un campo è vuoto la pagina mostra un testo generico.
// Il testo dell'informativa è in src/app/privacy/page.tsx: fallo verificare dal vostro consulente privacy.
/**
 * Versione dell'informativa. Cambiala (es. con la data) quando modifichi il testo in src/app/privacy/page.tsx:
 * a tutti gli utenti verrà chiesto di accettarla di nuovo al prossimo accesso.
 */
export const PRIVACY_VERSIONE = "2026-11-10";

export const TITOLARE = {
  /** Denominazione completa, es. "ASD Karate Club Palermo". Se vuoto si usa il nome della società nell'app. */
  denominazione: "ASD Polisportiva Levante",
  /** Sede legale, es. "Via Roma 1, 90100 Palermo". */
  sede: "",
  /** Recapito per le richieste privacy (email o telefono della segreteria). */
  contatto: "",
  /** Regione del progetto Supabase (Project Settings → General). */
  regioneDati: "Unione Europea (Francoforte, Germania)",
  /** Data dell'ultimo aggiornamento dell'informativa (GG/MM/AAAA). */
  aggiornata: "10/11/2026",
};
