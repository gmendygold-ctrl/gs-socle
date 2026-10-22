/**
 * Outils de test de la base : crée une base jetable, applique la simulation
 * Supabase + toutes les migrations, puis permet d'exécuter des requêtes
 * « en tant que » un utilisateur (rôle authenticated + JWT simulé) ou anonyme.
 */
import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const URL_ADMIN = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

export type Base = {
  client: Client;
  creerUtilisateur: (email: string, nom?: string) => Promise<string>;
  enTantQue: <T = Record<string, unknown>>(userId: string | null, sql: string, params?: unknown[]) => Promise<T[]>;
  fermer: () => Promise<void>;
};

export async function preparerBase(): Promise<Base> {
  const nomBase = `test_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const admin = new Client({ connectionString: URL_ADMIN });
  await admin.connect();
  await admin.query(`create database ${nomBase}`);
  await admin.end();

  const url = new URL(URL_ADMIN);
  url.pathname = `/${nomBase}`;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();

  const racine = join(process.cwd(), "supabase");
  await client.query(readFileSync(join(racine, "tests", "00_simulation_supabase.sql"), "utf8"));
  for (const f of readdirSync(join(racine, "migrations")).filter((f) => f.endsWith(".sql")).sort()) {
    await client.query(readFileSync(join(racine, "migrations", f), "utf8"));
  }

  return {
    client,
    async creerUtilisateur(email, nom) {
      const { rows } = await client.query<{ id: string }>(
        "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
        [email, { nom_complet: nom ?? email }],
      );
      return rows[0].id;
    },
    async enTantQue(userId, sql, params = []) {
      await client.query("begin");
      try {
        if (userId) {
          await client.query("set local role authenticated");
          await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
        } else {
          await client.query("set local role anon");
        }
        const { rows } = await client.query(sql, params);
        await client.query("commit");
        return rows;
      } catch (e) {
        await client.query("rollback");
        throw e;
      }
    },
    async fermer() {
      await client.end();
      const a = new Client({ connectionString: URL_ADMIN });
      await a.connect();
      await a.query(`drop database if exists ${nomBase} with (force)`);
      await a.end();
    },
  };
}
