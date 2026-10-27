"use client";
import { useRouter } from "next/navigation";

export function SceltaMese({ mese }: { mese: string }) {
  const router = useRouter();
  return (
    <div style={{ width: 180 }}>
      <input id="mese" type="month" aria-label="Mese" defaultValue={mese}
        onChange={(e) => e.target.value && router.push(`/misure?mese=${e.target.value}`)} />
    </div>
  );
}
