import type { SQLiteDatabase } from 'expo-sqlite';

export const NOM_BASE = 'monemploi.db';
const VERSION = 1;

/**
 * Création / migration du schéma, exécutée une seule fois à l'ouverture
 * (SQLiteProvider.onInit). La version est suivie via PRAGMA user_version.
 */
export async function initialiserBase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const ligne = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = ligne?.user_version ?? 0;
  if (version >= VERSION) return;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS salle (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nom       TEXT NOT NULL UNIQUE COLLATE NOCASE,
        capacite  INTEGER NOT NULL DEFAULT 0 CHECK (capacite >= 0),
        type      TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS enseignant (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        nom        TEXT NOT NULL,
        prenom     TEXT NOT NULL DEFAULT '',
        email      TEXT NOT NULL DEFAULT '',
        specialite TEXT NOT NULL DEFAULT '',
        UNIQUE (nom, prenom)
      );
      CREATE TABLE IF NOT EXISTS groupe (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        nom      TEXT NOT NULL UNIQUE COLLATE NOCASE,
        effectif INTEGER NOT NULL DEFAULT 0 CHECK (effectif >= 0),
        niveau   TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS seance (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        matiere       TEXT NOT NULL,
        jour          INTEGER NOT NULL CHECK (jour BETWEEN 1 AND 6),
        debut         INTEGER NOT NULL,
        fin           INTEGER NOT NULL,
        salle_id      INTEGER NOT NULL REFERENCES salle(id) ON DELETE CASCADE,
        enseignant_id INTEGER NOT NULL REFERENCES enseignant(id) ON DELETE CASCADE,
        groupe_id     INTEGER NOT NULL REFERENCES groupe(id) ON DELETE CASCADE,
        notes         TEXT NOT NULL DEFAULT '',
        CHECK (fin > debut)
      );
      CREATE INDEX IF NOT EXISTS idx_seance_salle      ON seance (salle_id, jour, debut);
      CREATE INDEX IF NOT EXISTS idx_seance_enseignant ON seance (enseignant_id, jour, debut);
      CREATE INDEX IF NOT EXISTS idx_seance_groupe     ON seance (groupe_id, jour, debut);
    `);
  }
  // Futures migrations : if (version < 2) { ... }

  await db.execAsync(`PRAGMA user_version = ${VERSION}`);
}
