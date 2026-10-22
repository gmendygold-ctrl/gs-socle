import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { estPageProtegee } from "@/lib/routes";

/** Rafraîchit la session à chaque requête et protège les pages privées. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // Configuration absente : on bloque les pages privées plutôt que de les ouvrir.
    if (estPageProtegee(request.nextUrl.pathname)) return rediriger(request, "/auth/connexion");
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // Ne rien exécuter entre createServerClient et getClaims (risque de déconnexions aléatoires).
  const { data } = await supabase.auth.getClaims();
  const utilisateur = data?.claims;

  if (!utilisateur && estPageProtegee(request.nextUrl.pathname)) {
    const reponse = rediriger(request, "/auth/connexion");
    supabaseResponse.cookies.getAll().forEach((c) => reponse.cookies.set(c));
    return reponse;
  }
  return supabaseResponse;
}

function rediriger(request: NextRequest, chemin: string) {
  const cible = request.nextUrl.clone();
  cible.pathname = chemin;
  cible.searchParams.set("suite", request.nextUrl.pathname);
  return NextResponse.redirect(cible);
}
