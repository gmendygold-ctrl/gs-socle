import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cheminSur } from "@/lib/routes";

/**
 * Retour du lien de confirmation d'e-mail. Deux formats acceptés :
 *  - `?code=…` : modèle d'e-mail Supabase par défaut (flux PKCE de @supabase/ssr) ;
 *  - `?token_hash=…&type=…` : modèle personnalisé
 *    `{{ .SiteURL }}/auth/confirmation?token_hash={{ .TokenHash }}&type=email`
 *    (fonctionne même si le lien est ouvert sur un autre appareil).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const suite = cheminSur(searchParams.get("suite"));
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
  }
  return NextResponse.redirect(new URL("/auth/connexion?erreur=lien", request.url));
}
