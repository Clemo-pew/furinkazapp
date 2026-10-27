import { SCALA, VOCI_VALUTAZIONE } from "@/lib/domain/valutazioni";

const fmt = (v: number) => String(v).replace(".", ",");

/**
 * Grafico radar delle valutazioni: area piena = ultima valutazione,
 * linea tratteggiata = valutazione precedente (se c'è).
 */
export function Radar({ attuale, precedente }: { attuale: Record<string, number>; precedente?: Record<string, number> }) {
  const voci = VOCI_VALUTAZIONE;
  const C = 160, R = 105, N = voci.length;
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / N;
  const pt = (i: number, v: number) => {
    const r = (R * (Math.max(SCALA.min - 1, Math.min(SCALA.max, v)) - (SCALA.min - 1))) / (SCALA.max - SCALA.min + 1);
    return [C + r * Math.cos(ang(i)), C + r * Math.sin(ang(i))] as const;
  };
  const poligono = (valori: Record<string, number>) =>
    voci.map((v, i) => pt(i, valori[v.chiave] ?? 0).map((n) => n.toFixed(1)).join(",")).join(" ");
  const anelli = [2, 4, 6, 8, 10].filter((x) => x <= SCALA.max);

  return (
    <svg viewBox="-50 0 420 320" role="img" aria-label="Grafico radar delle valutazioni" style={{ width: "100%", maxWidth: 420, height: "auto", display: "block" }}>
      {anelli.map((a) => (
        <polygon key={a} points={voci.map((_, i) => pt(i, a).join(",")).join(" ")} fill="none" stroke="var(--line)" strokeWidth="1" />
      ))}
      {voci.map((_, i) => {
        const [x, y] = pt(i, SCALA.max);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" />;
      })}
      {precedente && (
        <polygon points={poligono(precedente)} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 4" />
      )}
      <polygon points={poligono(attuale)} fill="var(--brand)" fillOpacity="0.18" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" />
      {voci.map((v, i) => {
        const val = attuale[v.chiave];
        if (val == null) return null;
        const [x, y] = pt(i, val);
        return <circle key={v.chiave} cx={x} cy={y} r="4" fill="var(--brand)" />;
      })}
      {voci.map((v, i) => {
        const [x, y] = [C + (R + 22) * Math.cos(ang(i)), C + (R + 22) * Math.sin(ang(i))];
        const anchor = Math.abs(x - C) < 5 ? "middle" : x > C ? "start" : "end";
        const val = attuale[v.chiave];
        return (
          <text key={v.chiave} x={x} y={y + 4} textAnchor={anchor} fontSize="12" fill="var(--ink)">
            <tspan fontWeight="600">{v.breve}</tspan>
            <tspan fill="var(--muted)" fontFamily="var(--mono)"> {val != null ? fmt(val) : "—"}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
