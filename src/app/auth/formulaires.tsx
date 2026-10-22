"use client";

import { useActionState } from "react";
import Link from "next/link";
import { seConnecter, sInscrire, type EtatFormulaire } from "./actions";
import { Alerte, Bouton, Champ } from "@/components/ui";

const initial: EtatFormulaire = {};

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState(seConnecter, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      <input type="hidden" name="suite" value={suite ?? "/espace"} />
      <Champ label="Adresse e-mail" nom="email" type="email" autoComplete="email" required erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
      <Champ label="Mot de passe" nom="motDePasse" type="password" autoComplete="current-password" required erreur={etat.erreurs?.motDePasse} />
      <Bouton type="submit" disabled={enCours} className="w-full">{enCours ? "Connexion…" : "Se connecter"}</Bouton>
      <p className="text-center text-sm">Pas encore de compte ? <Link className="text-violet underline" href="/auth/inscription">Créer un compte</Link></p>
    </form>
  );
}

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState(sInscrire, initial);
  if (etat.succes) return <Alerte type="succes">{etat.succes}</Alerte>;
  return (
    <form action={action} className="space-y-4" noValidate>
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      <Champ label="Nom complet" nom="nomComplet" autoComplete="name" required erreur={etat.erreurs?.nomComplet} defaultValue={etat.valeurs?.nomComplet} />
      <Champ label="Adresse e-mail" nom="email" type="email" autoComplete="email" required erreur={etat.erreurs?.email} defaultValue={etat.valeurs?.email} />
      <Champ label="Mot de passe (10 caractères, lettres et chiffres)" nom="motDePasse" type="password" autoComplete="new-password" required erreur={etat.erreurs?.motDePasse} />
      <Bouton type="submit" disabled={enCours} className="w-full">{enCours ? "Création…" : "Créer mon compte"}</Bouton>
      <p className="text-center text-sm">Déjà inscrit ? <Link className="text-violet underline" href="/auth/connexion">Se connecter</Link></p>
    </form>
  );
}
