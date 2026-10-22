import { z } from "zod";

const texte = (min: number, max: number, nom: string) =>
  z.string().trim().min(min, `${nom} : ${min} caractères minimum`).max(max, `${nom} : ${max} caractères maximum`);

export const schemaConnexion = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

export const schemaInscription = z.object({
  nomComplet: texte(2, 120, "Nom complet"),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  motDePasse: z
    .string()
    .min(10, "Mot de passe : 10 caractères minimum")
    .regex(/[A-Za-z]/, "Mot de passe : au moins une lettre")
    .regex(/[0-9]/, "Mot de passe : au moins un chiffre"),
});

/** Transforme un nom en identifiant d'URL : « Commune de Ndorna » → « commune-de-ndorna ». */
export function slugifier(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const schemaOrganisation = z.object({
  nom: texte(2, 120, "Nom"),
});

export const STATUTS = ["nouvelle", "en_cours", "traitee", "rejetee"] as const;
export const LIBELLES_STATUT: Record<(typeof STATUTS)[number], string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  traitee: "Traitée",
  rejetee: "Rejetée",
};

export const schemaDemande = z.object({
  organisationId: z.string().uuid("Organisation invalide"),
  titre: texte(3, 160, "Titre"),
  description: z.string().trim().max(5000, "Description : 5000 caractères maximum").optional().transform((v) => v || null),
});

export const schemaStatut = z.object({
  demandeId: z.string().uuid(),
  statut: z.enum(STATUTS),
});

/** Messages d'erreur lisibles par champ, à partir d'une erreur Zod. */
export function erreursParChamp(erreur: z.ZodError): Record<string, string> {
  const res: Record<string, string> = {};
  for (const i of erreur.issues) {
    const champ = String(i.path[0] ?? "formulaire");
    res[champ] ??= i.message;
  }
  return res;
}

/** Traduit les erreurs techniques (Postgres / Supabase) en message compréhensible, sans détail interne. */
export function messageErreur(code: string | undefined): string {
  switch (code) {
    case "23505": return "Cet élément existe déjà (nom ou identifiant en double).";
    case "42501": return "Vous n'avez pas les droits pour cette action.";
    case "23514": return "Une valeur ne respecte pas les règles (longueur, format).";
    case "invalid_credentials": return "E-mail ou mot de passe incorrect.";
    case "email_not_confirmed": return "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail).";
    case "user_already_exists": return "Un compte existe déjà avec cette adresse.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "Trop de tentatives. Réessayez dans quelques minutes.";
    default: return "Une erreur est survenue. Réessayez ou contactez l'administrateur.";
  }
}
