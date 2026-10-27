import { redirect } from "next/navigation";
import { contesto } from "@/lib/data/contesto";

// Pagina iniziale: smista l'utente in base al ruolo.
export default async function Home() {
  const c = await contesto();
  redirect(c.staff ? "/squadra" : `/atleti/${c.atletaId}`);
}
