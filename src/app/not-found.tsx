import Link from "next/link";
export default function Introuvable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-encre/70">Cette page n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
      <Link href="/" className="text-violet underline">Retour à l&apos;accueil</Link>
    </main>
  );
}
