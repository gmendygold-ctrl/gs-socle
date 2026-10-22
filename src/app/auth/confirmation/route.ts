import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cheminSur } from "@/lib/routes";

/** Lien de confirmation d'e-mail (modèle d'e-mail Supabase : {{ .SiteURL }}/auth/confirmation?token_hash={{ .TokenHash }}&type=email). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const suite = cheminSur(searchParams.get("suite"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(suite, request.url));
  }
  return NextResponse.redirect(new URL("/auth/connexion?erreur=lien", request.url));
}
