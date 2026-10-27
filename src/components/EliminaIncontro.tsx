"use client";
import { useState, useTransition } from "react";
import { eliminaIncontro } from "@/app/(app)/kumite/azioni";

export function EliminaIncontro({ id }: { id: string }) {
  const [conferma, setConferma] = useState(false);
  const [attesa, avvia] = useTransition();
  return (
    <button
      type="button"
      className="btn small danger"
      disabled={attesa}
      onClick={() => (conferma ? avvia(() => eliminaIncontro(id)) : setConferma(true))}
    >
      {conferma ? "Conferma eliminazione" : "Elimina incontro"}
    </button>
  );
}
