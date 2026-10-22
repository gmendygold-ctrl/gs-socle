import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-wide text-encre">
      <Image src="/logo-gs-global.png" alt="" width={36} height={33} priority />
      <span>GS GLOBAL</span>
    </Link>
  );
}

export function Carte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-bordure bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

export function Champ({
  label, nom, erreur, ...props
}: { label: string; nom: string; erreur?: string } & ComponentProps<"input">) {
  const idErreur = erreur ? `${nom}-erreur` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={nom} className="block text-sm font-medium">{label}</label>
      <input
        id={nom} name={nom} aria-invalid={!!erreur} aria-describedby={idErreur}
        className="w-full rounded-lg border border-bordure bg-white px-3 py-2 outline-none focus:border-violet aria-[invalid=true]:border-erreur"
        {...props}
      />
      {erreur && <p id={idErreur} className="text-sm text-erreur">{erreur}</p>}
    </div>
  );
}

export function Bouton({ children, className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg bg-violet px-4 py-2 font-semibold text-white hover:bg-violet-fonce disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Alerte({ type, children }: { type: "erreur" | "succes"; children: ReactNode }) {
  const style = type === "erreur" ? "border-erreur/30 bg-red-50 text-erreur" : "border-succes/30 bg-green-50 text-succes";
  return <p role={type === "erreur" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${style}`}>{children}</p>;
}
