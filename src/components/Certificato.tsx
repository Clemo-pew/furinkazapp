import { descriviScadenza, nomeTipo, statoCertificato } from "@/lib/domain/certificato";
import { dataIt } from "@/lib/domain/date";
import type { CertificatoMedico } from "@/lib/domain/tipi";

const CLASSE = { valido: "cert-ok", in_scadenza: "cert-avviso", scaduto: "cert-scaduto", mancante: "cert-mancante" } as const;

/** Etichetta del certificato medico: tipo, scadenza e stato a colori. */
export function Certificato({ certificato, oggi, compatto = false }: { certificato: CertificatoMedico | undefined; oggi: string; compatto?: boolean }) {
  const stato = statoCertificato(certificato?.scadenza, oggi);
  if (!certificato) return <span className={`cert ${CLASSE.mancante}`}>Certificato medico non inserito</span>;
  if (compatto) {
    if (stato === "valido") return null;
    return <span className={`cert ${CLASSE[stato]}`}>{stato === "scaduto" ? "Certificato scaduto" : "Certificato in scadenza"}</span>;
  }
  return (
    <span className={`cert ${CLASSE[stato]}`}>
      Certificato {nomeTipo(certificato.tipo).toLowerCase()} · scade il {dataIt(certificato.scadenza)}
      {stato !== "valido" && <> · <b>{descriviScadenza(certificato.scadenza, oggi)}</b></>}
    </span>
  );
}
