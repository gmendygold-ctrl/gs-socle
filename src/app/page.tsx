import Link from "next/link";
import { Logo } from "@/components/ui";

export default function Accueil() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-4 py-12">
      <Logo />
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-or">Socle applicatif</p>
        <h1 className="text-4xl font-bold leading-tight">Des plateformes sûres, prêtes pour les communes, ONG et entreprises.</h1>
        <p className="text-lg text-encre/80">
          Comptes utilisateurs, organisations, rôles (admin, agent, lecteur), dossiers suivis et journal d&apos;audit :
          la base commune de tous les projets GS Global.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/auth/inscription" className="rounded-lg bg-violet px-5 py-3 font-semibold text-white hover:bg-violet-fonce">Créer un compte</Link>
        <Link href="/auth/connexion" className="rounded-lg border border-bordure bg-white px-5 py-3 font-semibold">Se connecter</Link>
      </div>
    </main>
  );
}
