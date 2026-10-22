/**
 * Tests de sécurité de la base (RLS, droits par colonne, triggers).
 * Chaque test vérifie une règle métier d'accès : qui peut lire / écrire quoi.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { preparerBase, type Base } from "./aide-db";

let db: Base;
let alice: string, bob: string, carole: string, dave: string;
let orgA: string, orgB: string, demandeA: string;

beforeAll(async () => {
  db = await preparerBase();
  alice = await db.creerUtilisateur("alice@test.sn", "Alice (admin A)");
  bob = await db.creerUtilisateur("bob@test.sn", "Bob (lecteur A)");
  carole = await db.creerUtilisateur("carole@test.sn", "Carole (agent A)");
  dave = await db.creerUtilisateur("dave@test.sn", "Dave (admin B)");

  [{ id: orgA }] = await db.enTantQue<{ id: string }>(alice,
    "insert into organisations (nom, slug) values ('Commune A', 'commune-a') returning id");
  [{ id: orgB }] = await db.enTantQue<{ id: string }>(dave,
    "insert into organisations (nom, slug) values ('ONG B', 'ong-b') returning id");
}, 60_000);

afterAll(async () => { await db?.fermer(); });

const refuse = expect.objectContaining({ code: expect.stringMatching(/^(42501|P0001)$/) });

describe("Organisations et rôles", () => {
  it("le créateur d'une organisation en devient admin", async () => {
    const r = await db.enTantQue(alice, "select role from membres where organisation_id = $1 and user_id = $2", [orgA, alice]);
    expect(r).toEqual([{ role: "admin" }]);
  });

  it("un non-membre ne voit pas l'organisation d'un autre", async () => {
    expect(await db.enTantQue(dave, "select id from organisations where id = $1", [orgA])).toEqual([]);
    expect(await db.enTantQue(alice, "select id from organisations where id = $1", [orgB])).toEqual([]);
  });

  it("l'admin ajoute des membres avec leur rôle", async () => {
    await db.enTantQue(alice, "insert into membres (organisation_id, user_id, role) values ($1,$2,'lecteur'),($1,$3,'agent')", [orgA, bob, carole]);
    const r = await db.enTantQue(bob, "select count(*)::int n from membres where organisation_id = $1", [orgA]);
    expect(r[0]).toEqual({ n: 3 });
  });

  it("un lecteur ne peut pas s'attribuer un rôle supérieur", async () => {
    const r = await db.enTantQue(bob, "update membres set role = 'admin' where organisation_id = $1 and user_id = $2 returning role", [orgA, bob]);
    expect(r).toEqual([]); // aucune ligne modifiée
  });

  it("un non-membre ne peut pas s'ajouter à une organisation", async () => {
    await expect(db.enTantQue(dave, "insert into membres (organisation_id, user_id, role) values ($1,$2,'admin')", [orgA, dave])).rejects.toEqual(refuse);
  });

  it("le dernier admin ne peut pas se retirer ni se rétrograder", async () => {
    await expect(db.enTantQue(alice, "update membres set role='agent' where organisation_id=$1 and user_id=$2", [orgA, alice])).rejects.toEqual(refuse);
    await expect(db.enTantQue(alice, "delete from membres where organisation_id=$1 and user_id=$2", [orgA, alice])).rejects.toEqual(refuse);
  });
});

describe("Demandes (module métier)", () => {
  it("un agent crée une demande dans son organisation", async () => {
    [{ id: demandeA }] = await db.enTantQue<{ id: string }>(carole,
      "insert into demandes (organisation_id, titre) values ($1, 'Réparation forage Ndorna') returning id", [orgA]);
    expect(demandeA).toMatch(/[0-9a-f-]{36}/);
  });

  it("un lecteur lit mais ne peut ni créer ni modifier", async () => {
    expect(await db.enTantQue(bob, "select titre from demandes where id=$1", [demandeA])).toHaveLength(1);
    await expect(db.enTantQue(bob, "insert into demandes (organisation_id, titre) values ($1,'Test lecteur')", [orgA])).rejects.toEqual(refuse);
    expect(await db.enTantQue(bob, "update demandes set statut='traitee' where id=$1 returning id", [demandeA])).toEqual([]);
  });

  it("personne ne peut créer une demande au nom d'un autre", async () => {
    await expect(db.enTantQue(carole, "insert into demandes (organisation_id, titre, cree_par) values ($1,'Usurpation',$2)", [orgA, alice])).rejects.toEqual(refuse);
  });

  it("le créateur et l'organisation d'une demande sont figés", async () => {
    await expect(db.enTantQue(alice, "update demandes set organisation_id=$1 where id=$2", [orgB, demandeA])).rejects.toEqual(refuse);
    await expect(db.enTantQue(alice, "update demandes set cree_par=$1 where id=$2", [alice, demandeA])).rejects.toEqual(refuse);
  });

  it("une autre organisation ne voit ni ne modifie les demandes", async () => {
    expect(await db.enTantQue(dave, "select id from demandes where id=$1", [demandeA])).toEqual([]);
    expect(await db.enTantQue(dave, "update demandes set statut='rejetee' where id=$1 returning id", [demandeA])).toEqual([]);
    await expect(db.enTantQue(dave, "insert into demandes (organisation_id, titre) values ($1,'Intrusion')", [orgA])).rejects.toEqual(refuse);
  });

  it("un agent change le statut ; seul l'admin supprime", async () => {
    expect(await db.enTantQue(carole, "update demandes set statut='en_cours' where id=$1 returning statut", [demandeA])).toEqual([{ statut: "en_cours" }]);
    expect(await db.enTantQue(carole, "delete from demandes where id=$1 returning id", [demandeA])).toEqual([]);
  });
});

describe("Journal d'audit", () => {
  it("chaque action est journalisée, lisible par l'admin seulement", async () => {
    const pourAdmin = await db.enTantQue<{ n: number }>(alice, "select count(*)::int n from journal where organisation_id=$1", [orgA]);
    expect(pourAdmin[0].n).toBeGreaterThanOrEqual(5);
    expect(await db.enTantQue(carole, "select id from journal")).toEqual([]);
  });

  it("personne ne peut écrire ni effacer le journal directement", async () => {
    await expect(db.enTantQue(alice, "insert into journal (table_nom, ligne_id, action) values ('x','1','INSERT')")).rejects.toEqual(refuse);
    await expect(db.enTantQue(alice, "delete from journal")).rejects.toEqual(refuse);
  });
});

describe("Profils et données personnelles", () => {
  it("on voit le profil de ses collègues, pas celui des autres organisations", async () => {
    expect(await db.enTantQue(bob, "select nom_complet from profils where id=$1", [alice])).toHaveLength(1);
    expect(await db.enTantQue(dave, "select nom_complet from profils where id=$1", [alice])).toEqual([]);
  });

  it("on ne modifie que son propre profil", async () => {
    expect(await db.enTantQue(bob, "update profils set nom_complet='Bob D.' where id=$1 returning nom_complet", [bob])).toEqual([{ nom_complet: "Bob D." }]);
    expect(await db.enTantQue(bob, "update profils set nom_complet='Piraté' where id=$1 returning id", [alice])).toEqual([]);
  });
});

describe("Accès anonyme", () => {
  it("un visiteur anonyme n'accède à aucune table", async () => {
    for (const t of ["organisations", "membres", "profils", "demandes", "journal"]) {
      await expect(db.enTantQue(null, `select * from ${t}`)).rejects.toEqual(refuse);
    }
  });

  it("les fonctions privées ne sont pas appelables anonymement", async () => {
    await expect(db.enTantQue(null, "select private.role_dans($1)", [orgA])).rejects.toEqual(refuse);
  });
});

describe("Suppression", () => {
  it("l'admin supprime son organisation (cascade complète)", async () => {
    expect(await db.enTantQue(dave, "delete from organisations where id=$1 returning id", [orgB])).toHaveLength(1);
    const r = await db.client.query("select count(*)::int n from membres where organisation_id=$1", [orgB]);
    expect(r.rows[0].n).toBe(0);
  });
});

describe("Traçabilité après suppression", () => {
  it("la suppression de l'organisation reste tracée dans le journal", async () => {
    const r = await db.client.query("select action from journal where organisation_id=$1 and table_nom='organisations' order by id", [orgB]);
    expect(r.rows.map((x) => x.action)).toEqual(["INSERT", "DELETE"]);
  });
});
