"use client";

import { useActionState } from "react";
import { creerDemande, creerOrganisation } from "./actions";
import { Alerte, Bouton, Champ } from "@/components/ui";
import type { EtatFormulaire } from "@/app/auth/actions";

const initial: EtatFormulaire = {};

export function FormulaireOrganisation() {
  const [etat, action, enCours] = useActionState(creerOrganisation, initial);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
      <div className="flex-1"><Champ label="Nom de l'organisation (commune, ONG…)" nom="nom" required erreur={etat.erreurs?.nom} defaultValue={etat.valeurs?.nom} /></div>
      <Bouton type="submit" disabled={enCours}>{enCours ? "Création…" : "Créer"}</Bouton>
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
    </form>
  );
}

export function FormulaireDemande({ organisationId }: { organisationId: string }) {
  const [etat, action, enCours] = useActionState(creerDemande, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="organisationId" value={organisationId} />
      <Champ label="Titre" nom="titre" required erreur={etat.erreurs?.titre} defaultValue={etat.valeurs?.titre} />
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">Description (facultatif)</label>
        <textarea id="description" name="description" rows={3} maxLength={5000} defaultValue={etat.valeurs?.description}
          className="w-full rounded-lg border border-bordure px-3 py-2 outline-none focus:border-violet" />
      </div>
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      {etat.succes && <Alerte type="succes">{etat.succes}</Alerte>}
      <Bouton type="submit" disabled={enCours}>{enCours ? "Enregistrement…" : "Ajouter la demande"}</Bouton>
    </form>
  );
}
