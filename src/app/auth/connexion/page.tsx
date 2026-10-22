import type { Metadata } from "next";
import { Suspense } from "react";
import { Carte, Logo } from "@/components/ui";
import { cheminSur } from "@/lib/routes";
import { FormulaireConnexion } from "../formulaires";

export const metadata: Metadata = { title: "Connexion" };

export default function PageConnexion(props: PageProps<"/auth/connexion">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <Logo />
      <Carte>
        <h1 className="mb-4 text-2xl font-bold">Connexion</h1>
        <Suspense fallback={<p className="text-encre/60">Chargement…</p>}>
          <AvecSuite searchParams={props.searchParams} />
        </Suspense>
      </Carte>
    </main>
  );
}

async function AvecSuite({ searchParams }: { searchParams: PageProps<"/auth/connexion">["searchParams"] }) {
  const { suite, erreur } = await searchParams;
  return (
    <>
      {erreur === "lien" && <p role="alert" className="mb-4 text-sm text-erreur">Lien expiré ou invalide. Reconnectez-vous ou demandez un nouveau lien.</p>}
      <FormulaireConnexion suite={cheminSur(suite)} />
    </>
  );
}
