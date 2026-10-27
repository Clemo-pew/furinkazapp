// Sagoma con le aree dove l'atleta subisce punti: jodan/chudan × sinistro/centro/destro, più "a terra".
// SX e DX sono i lati del corpo dell'atleta.
export function MappaColpi({ conteggi }: { conteggi: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(conteggi));
  const op = (k: string) => (conteggi[k] ? (0.12 + (0.78 * conteggi[k]) / max).toFixed(2) : "0");
  const cella = (z: string, p: string, x: number, y: number, w: number, h: number) => {
    const k = `${z}_${p}`;
    return (
      <g key={k}>
        <rect x={x} y={y} width={w} height={h} fill="var(--bad)" fillOpacity={op(k)} />
        <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--mono)">{conteggi[k] || ""}</text>
      </g>
    );
  };
  const busto = "M55 86 Q95 78 135 86 L140 170 Q95 180 50 170 Z";
  return (
    <svg viewBox="0 0 190 250" role="img" aria-label="Aree del corpo dove subisce punti">
      <defs>
        <clipPath id="mc-testa"><circle cx="95" cy="42" r="32" /></clipPath>
        <clipPath id="mc-busto"><path d={busto} /></clipPath>
      </defs>
      <g clipPath="url(#mc-testa)">
        {cella("jodan", "sx", 63, 10, 21, 64)}{cella("jodan", "c", 84, 10, 22, 64)}{cella("jodan", "dx", 106, 10, 21, 64)}
      </g>
      <circle cx="95" cy="42" r="32" fill="none" stroke="var(--muted)" strokeWidth="1.5" />
      <g clipPath="url(#mc-busto)">
        {cella("chudan", "sx", 50, 78, 30, 104)}{cella("chudan", "c", 80, 78, 30, 104)}{cella("chudan", "dx", 110, 78, 30, 104)}
      </g>
      <path d={busto} fill="none" stroke="var(--muted)" strokeWidth="1.5" />
      <path d="M55 88 L30 150 M135 88 L160 150 M70 172 L64 205 M120 172 L126 205" stroke="var(--line)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="25" y="214" width="140" height="22" rx="6" fill="var(--bad)" fillOpacity={op("terra")} stroke="var(--muted)" strokeWidth="1.2" />
      <text x="95" y="229" textAnchor="middle" fontSize="11" fill="var(--ink)">A terra {conteggi.terra || 0}</text>
      <text x="40" y="20" fontSize="11" fontWeight="700" fill="var(--muted)">SX</text>
      <text x="150" y="20" textAnchor="end" fontSize="11" fontWeight="700" fill="var(--muted)">DX</text>
    </svg>
  );
}
