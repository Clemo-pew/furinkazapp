import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { FormBenvenuto } from "./FormBenvenuto";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Benvenuto" };

// Primo accesso: l'utente non appartiene ancora a nessun dojo.
export default async function Benvenuto() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/accedi");
  const user = { id: auth.claims.sub, email: auth.claims.email as string | undefined };
  const { count } = await supabase.from("membri").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  if (count) redirect("/");

  return (
    <main className="wrap accesso">
      <div className="card">
        <Logo altezza={40} />
        <FormBenvenuto />
        <form action="/auth/esci" method="post"><button className="linkbtn">Esci ({user.email})</button></form>
      </div>
    </main>
  );
}
