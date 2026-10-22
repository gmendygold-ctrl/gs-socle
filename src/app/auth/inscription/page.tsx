import type { Metadata } from "next";
import { Carte, Logo } from "@/components/ui";
import { FormulaireInscription } from "../formulaires";

export const metadata: Metadata = { title: "Créer un compte" };

export default function PageInscription() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <Logo />
      <Carte>
        <h1 className="mb-4 text-2xl font-bold">Créer un compte</h1>
        <FormulaireInscription />
      </Carte>
    </main>
  );
}
