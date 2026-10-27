// Mostrato subito mentre la pagina carica i dati: la navigazione risponde al tocco senza attese.
export default function Caricamento() {
  return (
    <div className="stack" aria-busy="true" aria-label="Caricamento">
      <div className="scheletro" style={{ height: 34, width: "40%" }} />
      <div className="scheletro" style={{ height: 140 }} />
      <div className="scheletro" style={{ height: 220 }} />
    </div>
  );
}
