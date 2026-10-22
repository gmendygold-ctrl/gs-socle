import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Carte } from "@/components/ui";
import { mesOrganisations } from "@/lib/dal";
import { FormulaireOrganisation } from "./formulaires";

export const metadata: Metadata = { title: "Mon espace" };

const LIBELLE_ROLE = { admin: "Administrateur", agent: "Agent", lecteur: "Lecteur" } as const;

export default function PageEspace() {
  return (
    <>
      <h1 className="text-3xl font-bold">Mon espace</h1>
      <Carte>
        <h2 className="mb-4 text-lg font-semibold">Mes organisations</h2>
        <Suspense fallback={<p className="text-encre/60">Chargement…</p>}>
          <ListeOrganisations />
        </Suspense>
      </Carte>
      <Carte>
        <h2 className="mb-4 text-lg font-semibold">Créer une organisation</h2>
        <FormulaireOrganisation />
      </Carte>
    </>
  );
}

async function ListeOrganisations() {
  const orgs = await mesOrganisations();
  if (orgs.length === 0) return <p className="text-encre/70">Vous n&apos;appartenez encore à aucune organisation.</p>;
  return (
    <ul className="divide-y divide-bordure">
      {orgs.map((o) => (
        <li key={o.id} className="flex items-center justify-between py-3">
          <Link href={`/espace/${o.slug}`} className="font-medium text-violet hover:underline">{o.nom}</Link>
          <span className="rounded-full bg-gris px-3 py-1 text-xs">{LIBELLE_ROLE[o.role]}</span>
        </li>
      ))}
    </ul>
  );
}
