import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Couche d'accès aux données (DAL) : tout accès aux données passe par ici,
 * côté serveur. La sécurité réelle est garantie par la RLS de la base ;
 * ces vérifications servent à l'expérience utilisateur (redirections, 404).
 */
export const utilisateurCourant = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/auth/connexion");
  return { id: claims.sub as string, email: (claims.email as string | undefined) ?? "" };
});

export async function mesOrganisations() {
  const moi = await utilisateurCourant();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membres")
    .select("role, organisations ( id, nom, slug )")
    .eq("user_id", moi.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Lecture des organisations impossible");
  return (data ?? []).flatMap((m) => {
    const o = m.organisations as unknown as { id: string; nom: string; slug: string } | null;
    return o ? [{ ...o, role: m.role }] : [];
  });
}

export async function organisationParSlug(slug: string) {
  const orgs = await mesOrganisations();
  return orgs.find((o) => o.slug === slug) ?? null;
}

export async function demandesDe(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demandes")
    .select("id, titre, description, statut, created_at, updated_at")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Lecture des demandes impossible");
  return data ?? [];
}
