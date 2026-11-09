"use client";
import { useTransition } from "react";
import { cambiaEvidenza } from "@/app/(app)/bacheca/azioni";

export function PulsanteEvidenza({ id, inEvidenza }: { id: string; inEvidenza: boolean }) {
  const [attesa, avvia] = useTransition();
  return (
    <button type="button" className="btn small" disabled={attesa} onClick={() => avvia(() => cambiaEvidenza(id, !inEvidenza))}>
      {inEvidenza ? "Togli evidenza" : "Metti in evidenza"}
    </button>
  );
}
