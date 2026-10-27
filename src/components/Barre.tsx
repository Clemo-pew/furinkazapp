// Barre orizzontali semplici per conteggi (tecniche subite, segnate…).
export function Barre({ righe, colore }: { righe: [string, number][]; colore: string }) {
  if (!righe.length) return <p className="hint">Nessun punto registrato.</p>;
  const max = righe[0][1];
  return (
    <div className="bars">
      {righe.map(([etichetta, n]) => (
        <div className="brow" key={etichetta}>
          <span title={etichetta}>{etichetta}</span>
          <div className="track"><i style={{ width: `${(n / max) * 100}%`, background: colore }} /></div>
          <span className="num">{n}</span>
        </div>
      ))}
    </div>
  );
}
