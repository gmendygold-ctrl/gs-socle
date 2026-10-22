import { describe, expect, it } from "vitest";
import { cheminSur, estPageProtegee } from "@/lib/routes";
import {
  erreursParChamp, messageErreur, schemaDemande, schemaInscription, schemaStatut, slugifier,
} from "@/lib/validation/schemas";

describe("slugifier", () => {
  it("retire accents, espaces et ponctuation", () => {
    expect(slugifier("Commune de Thiétty — Kolda !")).toBe("commune-de-thietty-kolda");
    expect(slugifier("  ONG   Sénégal  ")).toBe("ong-senegal");
  });
  it("limite la longueur", () => {
    expect(slugifier("a".repeat(100))).toHaveLength(60);
  });
});

describe("inscription", () => {
  it("refuse un mot de passe faible et donne un message par champ", () => {
    const r = schemaInscription.safeParse({ nomComplet: "G", email: "pas-un-email", motDePasse: "court" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = erreursParChamp(r.error);
      expect(Object.keys(e).sort()).toEqual(["email", "motDePasse", "nomComplet"]);
    }
  });
  it("normalise l'e-mail", () => {
    const r = schemaInscription.parse({ nomComplet: "Gérard Mendy", email: "  GMENDY@Exemple.SN ", motDePasse: "Dakar2026sn" });
    expect(r.email).toBe("gmendy@exemple.sn");
  });
});

describe("demandes", () => {
  it("description vide devient null, titre trop court refusé", () => {
    const ok = schemaDemande.parse({ organisationId: "6f1c1d0e-1b6a-4f43-9d5e-0b6a2a1c9a11", titre: "Forage", description: "" });
    expect(ok.description).toBeNull();
    expect(schemaDemande.safeParse({ organisationId: "x", titre: "ab" }).success).toBe(false);
  });
  it("statut limité aux valeurs autorisées", () => {
    expect(schemaStatut.safeParse({ demandeId: "6f1c1d0e-1b6a-4f43-9d5e-0b6a2a1c9a11", statut: "archivee" }).success).toBe(false);
  });
});

describe("sécurité des redirections", () => {
  it("n'accepte que des chemins internes", () => {
    expect(cheminSur("/espace/commune-a")).toBe("/espace/commune-a");
    expect(cheminSur("https://pirate.example")).toBe("/espace");
    expect(cheminSur("//pirate.example")).toBe("/espace");
    expect(cheminSur("/\\pirate.example")).toBe("/espace");
    expect(cheminSur(undefined)).toBe("/espace");
  });
  it("identifie les pages protégées", () => {
    expect(estPageProtegee("/espace")).toBe(true);
    expect(estPageProtegee("/espace/x")).toBe(true);
    expect(estPageProtegee("/espaces-verts")).toBe(false);
    expect(estPageProtegee("/")).toBe(false);
  });
});

describe("messages d'erreur", () => {
  it("ne révèle pas de détail technique", () => {
    expect(messageErreur("42501")).toMatch(/droits/);
    expect(messageErreur("XX999")).toMatch(/erreur est survenue/);
  });
});
