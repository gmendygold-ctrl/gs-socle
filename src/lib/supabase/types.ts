/**
 * Types de la base. En projet réel, les régénérer après chaque migration :
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 * (ou outil MCP Supabase `generate_typescript_types`).
 */
export type RoleMembre = "admin" | "agent" | "lecteur";
export type StatutDemande = "nouvelle" | "en_cours" | "traitee" | "rejetee";

type Table<Row, Insert, Update, Rel extends unknown[] = []> = { Row: Row; Insert: Insert; Update: Update; Relationships: Rel };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      organisations: Table<
        { id: string; nom: string; slug: string; cree_par: string; created_at: string },
        { id?: string; nom: string; slug: string; cree_par?: string; created_at?: string },
        { nom?: string; slug?: string }
      >;
      membres: Table<
        { organisation_id: string; user_id: string; role: RoleMembre; created_at: string },
        { organisation_id: string; user_id: string; role?: RoleMembre },
        { role?: RoleMembre },
        [
          {
            foreignKeyName: "membres_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ]
      >;
      profils: Table<
        { id: string; nom_complet: string | null; created_at: string; updated_at: string },
        { id: string; nom_complet?: string | null },
        { nom_complet?: string | null }
      >;
      demandes: Table<
        {
          id: string; organisation_id: string; titre: string; description: string | null;
          statut: StatutDemande; cree_par: string; assigne_a: string | null; created_at: string; updated_at: string;
        },
        { organisation_id: string; titre: string; description?: string | null; statut?: StatutDemande; assigne_a?: string | null },
        { titre?: string; description?: string | null; statut?: StatutDemande; assigne_a?: string | null }
      >;
      journal: Table<
        { id: number; organisation_id: string | null; table_nom: string; ligne_id: string; action: string; auteur: string | null; details: unknown; created_at: string },
        never,
        never
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { role_membre: RoleMembre; statut_demande: StatutDemande };
    CompositeTypes: Record<string, never>;
  };
};
