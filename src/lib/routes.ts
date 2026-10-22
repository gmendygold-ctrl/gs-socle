/** Pages réservées aux utilisateurs connectés. */
export const PREFIXES_PROTEGES = ["/espace"] as const;

export function estPageProtegee(chemin: string): boolean {
  return PREFIXES_PROTEGES.some((p) => chemin === p || chemin.startsWith(`${p}/`));
}

/** N'accepte qu'un chemin interne (évite les redirections ouvertes vers un autre site). */
export function cheminSur(suite: unknown, defaut = "/espace"): string {
  if (typeof suite !== "string" || !suite.startsWith("/") || suite.startsWith("//") || suite.includes("\\")) return defaut;
  return suite;
}
