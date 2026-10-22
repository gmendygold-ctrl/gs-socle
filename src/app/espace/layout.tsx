import { Suspense } from "react";
import { Logo } from "@/components/ui";
import { utilisateurCourant } from "@/lib/dal";
import { seDeconnecter } from "@/app/auth/actions";

export default function LayoutEspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-bordure bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <Suspense fallback={<span className="text-sm text-encre/60">…</span>}>
            <MenuUtilisateur />
          </Suspense>
        </div>
        <div className="h-1 bg-gradient-to-r from-violet via-violet to-or" />
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}

async function MenuUtilisateur() {
  const moi = await utilisateurCourant();
  return (
    <form action={seDeconnecter} className="flex items-center gap-3 text-sm">
      <span className="hidden text-encre/70 sm:inline">{moi.email}</span>
      <button className="rounded-lg border border-bordure px-3 py-1.5 hover:bg-gris">Se déconnecter</button>
    </form>
  );
}
