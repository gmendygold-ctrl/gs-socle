import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Carte } from "@/components/ui";
import { demandesDe, organisationParSlug } from "@/lib/dal";
import { LIBELLES_STATUT, STATUTS } from "@/lib/validation/schemas";
import { changerStatut } from "../actions";
import { FormulaireDemande } from "../formulaires";

export const metadata: Metadata = { title: "Demandes" };

export default function PageOrganisation(props: PageProps<"/espace/[slug]">) {
  return (
    <>
      <Link href="/espace" className="text-sm text-violet hover:underline">← Mon espace</Link>
      <Suspense fallback={<p className="text-encre/60">Chargement…</p>}>
        <Contenu params={props.params} />
      </Suspense>
    </>
  );
}

async function Contenu({ params }: { params: PageProps<"/espace/[slug]">["params"] }) {
  const { slug } = await params;
  const org = await organisationParSlug(slug);
  if (!org) notFound();
  const demandes = await demandesDe(org.id);
  const peutEcrire = org.role === "admin" || org.role === "agent";

  return (
    <>
      <h1 className="text-3xl font-bold">{org.nom}</h1>
      {peutEcrire && (
        <Carte>
          <h2 className="mb-4 text-lg font-semibold">Nouvelle demande</h2>
          <FormulaireDemande organisationId={org.id} />
        </Carte>
      )}
      <Carte>
        <h2 className="mb-4 text-lg font-semibold">Demandes ({demandes.length})</h2>
        {demandes.length === 0 ? (
          <p className="text-encre/70">Aucune demande pour le moment.</p>
        ) : (
          <ul className="divide-y divide-bordure">
            {demandes.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{d.titre}</p>
                  {d.description && <p className="text-sm text-encre/70">{d.description}</p>}
                  <p className="text-xs text-encre/50">{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                {peutEcrire ? (
                  <form action={changerStatut} className="flex items-center gap-2">
                    <input type="hidden" name="demandeId" value={d.id} />
                    <label className="sr-only" htmlFor={`statut-${d.id}`}>Statut</label>
                    <select id={`statut-${d.id}`} name="statut" defaultValue={d.statut} className="rounded-lg border border-bordure px-2 py-1 text-sm">
                      {STATUTS.map((s) => <option key={s} value={s}>{LIBELLES_STATUT[s]}</option>)}
                    </select>
                    <button className="rounded-lg border border-bordure px-3 py-1 text-sm hover:bg-gris">Mettre à jour</button>
                  </form>
                ) : (
                  <span className="rounded-full bg-gris px-3 py-1 text-xs">{LIBELLES_STATUT[d.statut]}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </>
  );
}
