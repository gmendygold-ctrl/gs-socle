"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cheminSur } from "@/lib/routes";
import { erreursParChamp, messageErreur, schemaConnexion, schemaInscription } from "@/lib/validation/schemas";

/** État renvoyé par une action de formulaire. `valeurs` permet de réafficher la saisie (jamais les mots de passe). */
export type EtatFormulaire = { erreurs?: Record<string, string>; message?: string; succes?: string; valeurs?: Record<string, string> };

const texte = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function seConnecter(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = { email: texte(formData.get("email")) };
  const r = schemaConnexion.safeParse({ email: formData.get("email"), motDePasse: formData.get("motDePasse") });
  if (!r.success) return { erreurs: erreursParChamp(r.error), valeurs };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: r.data.email, password: r.data.motDePasse });
  if (error) return { message: messageErreur(error.code), valeurs };
  redirect(cheminSur(formData.get("suite")));
}

export async function sInscrire(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = { nomComplet: texte(formData.get("nomComplet")), email: texte(formData.get("email")) };
  const r = schemaInscription.safeParse({
    nomComplet: formData.get("nomComplet"),
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
  });
  if (!r.success) return { erreurs: erreursParChamp(r.error), valeurs };

  const origine = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: r.data.email,
    password: r.data.motDePasse,
    options: { data: { nom_complet: r.data.nomComplet }, emailRedirectTo: `${origine}/auth/confirmation` },
  });
  // Même message que le compte existe ou non (évite de révéler les adresses inscrites).
  if (error && error.code !== "user_already_exists") return { message: messageErreur(error.code), valeurs };
  return { succes: "Vérifiez votre boîte e-mail : un lien de confirmation vous a été envoyé." };
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
