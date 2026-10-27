import { cintura } from "@/lib/domain/cinture";

export function Cintura({ grado }: { grado: number }) {
  const c = cintura(grado);
  return (
    <span className="belt"><i style={{ background: c.colore }} />{c.nome}</span>
  );
}
