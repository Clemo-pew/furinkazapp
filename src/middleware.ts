import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigurato } from "@/lib/supabase/config";

// Pagine raggiungibili senza aver fatto l'accesso.
const PUBBLICHE = ["/accedi", "/auth", "/configurazione"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!supabaseConfigurato) {
    if (pathname.startsWith("/configurazione")) return NextResponse.next();
    return NextResponse.redirect(new URL("/configurazione", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Aggiorna la sessione (non spostare: deve restare subito dopo la creazione del client).
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !PUBBLICHE.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/accedi";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
