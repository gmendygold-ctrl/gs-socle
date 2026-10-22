"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { utilisateurCourant } from "@/lib/dal";
import {
  erreursParChamp, messageErreur, schemaDemande, schemaOrganisation, schemaStatut, slugifier,
} from "@/lib/validation/schemas";
import type { EtatFormulaire } from "@/app/auth/actions";

export async function creerOrganisation(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await utilisateurCourant();
  const valeurs = { nom: String(formData.get("nom") ?? "") };
  const r = schemaOrganisation.safeParse({ nom: formData.get("nom") });
  if (!r.success) return { erreurs: erreursParChamp(r.error), valeurs };
  const slug = slugifier(r.data.nom);
  if (slug.length < 2) return { erreurs: { nom: "Nom trop court après simplification" }, valeurs };

  const supabase = await createClient();
  const { error } = await supabase.from("organisations").insert({ nom: r.data.nom, slug });
  if (error) return { message: messageErreur(error.code), valeurs };
  redirect(`/espace/${slug}`);
}

export async function creerDemande(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await utilisateurCourant();
  const valeurs = { titre: String(formData.get("titre") ?? ""), description: String(formData.get("description") ?? "") };
  const r = schemaDemande.safeParse({
    organisationId: formData.get("organisationId"),
    titre: formData.get("titre"),
    description: formData.get("description") ?? undefined,
  });
  if (!r.success) return { erreurs: erreursParChamp(r.error), valeurs };

  const supabase = await createClient();
  const { error } = await supabase
    .from("demandes")
    .insert({ organisation_id: r.data.organisationId, titre: r.data.titre, description: r.data.description });
  if (error) return { message: messageErreur(error.code), valeurs };
  refresh();
  return { succes: "Demande enregistrée." };
}

export async function changerStatut(formData: FormData): Promise<void> {
  await utilisateurCourant();
  const r = schemaStatut.safeParse({ demandeId: formData.get("demandeId"), statut: formData.get("statut") });
  if (!r.success) return;
  const supabase = await createClient();
  await supabase.from("demandes").update({ statut: r.data.statut }).eq("id", r.data.demandeId);
  refresh();
}
