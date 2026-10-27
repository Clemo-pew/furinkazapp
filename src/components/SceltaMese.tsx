"use client";
import { useRouter } from "next/navigation";

/** Selettore del mese che aggiorna l'indirizzo (?mese=AAAA-MM). */
export function SceltaMese({ mese, percorso = "/misure" }: { mese: string; percorso?: string }) {
  const router = useRouter();
  return (
    <div style={{ width: 180 }}>
      <input id="mese" type="month" aria-label="Mese" defaultValue={mese}
        onChange={(e) => e.target.value && router.push(`${percorso}?mese=${e.target.value}`)} />
    </div>
  );
}
