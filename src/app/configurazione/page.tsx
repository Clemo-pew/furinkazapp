import { supabaseConfigurato } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Mostrata solo se mancano le variabili d'ambiente di Supabase.
export default function Configurazione() {
  if (supabaseConfigurato) redirect("/");
  return (
    <main className="wrap accesso">
      <div className="card">
        <h1>Manca il collegamento a Supabase</h1>
        <p>Aggiungi queste due variabili d&apos;ambiente e riavvia (su Vercel: Settings → Environment Variables, poi Redeploy):</p>
        <pre className="num" style={{ whiteSpace: "pre-wrap", margin: 0 }}>NEXT_PUBLIC_SUPABASE_URL{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY</pre>
        <p className="hint">Le trovi in Supabase → Project Settings → API. La guida completa è nel file README.md.</p>
      </div>
    </main>
  );
}
