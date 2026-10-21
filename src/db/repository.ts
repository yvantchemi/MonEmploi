/**
 * Accès aux données (couche « repository »).
 * Chaque fonction exécute une seule requête paramétrée ; la lecture complète
 * n'a lieu qu'au démarrage (chargerTout), ensuite l'état en mémoire est mis à
 * jour directement à partir du résultat des écritures.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Enseignant, Groupe, Jour, Salle, Seance, SeanceBrouillon } from '../domain/types';

interface LigneSeance {
  id: number;
  matiere: string;
  jour: number;
  debut: number;
  fin: number;
  salle_id: number;
  enseignant_id: number;
  groupe_id: number;
  notes: string;
}

const versSeance = (l: LigneSeance): Seance => ({
  id: l.id,
  matiere: l.matiere,
  jour: l.jour as Jour,
  debut: l.debut,
  fin: l.fin,
  salleId: l.salle_id,
  enseignantId: l.enseignant_id,
  groupeId: l.groupe_id,
  notes: l.notes,
});

export interface Donnees {
  salles: Salle[];
  enseignants: Enseignant[];
  groupes: Groupe[];
  seances: Seance[];
}

export async function chargerTout(db: SQLiteDatabase): Promise<Donnees> {
  const [salles, enseignants, groupes, lignes] = await Promise.all([
    db.getAllAsync<Salle>('SELECT id, nom, capacite, type FROM salle ORDER BY nom'),
    db.getAllAsync<Enseignant>(
      'SELECT id, nom, prenom, email, specialite FROM enseignant ORDER BY nom, prenom',
    ),
    db.getAllAsync<Groupe>('SELECT id, nom, effectif, niveau FROM groupe ORDER BY nom'),
    db.getAllAsync<LigneSeance>('SELECT * FROM seance ORDER BY jour, debut'),
  ]);
  return { salles, enseignants, groupes, seances: lignes.map(versSeance) };
}

// --- Salles -----------------------------------------------------------------

export async function enregistrerSalle(db: SQLiteDatabase, s: Omit<Salle, 'id'> & { id?: number }): Promise<Salle> {
  if (s.id) {
    await db.runAsync('UPDATE salle SET nom = ?, capacite = ?, type = ? WHERE id = ?', s.nom, s.capacite, s.type, s.id);
    return s as Salle;
  }
  const r = await db.runAsync('INSERT INTO salle (nom, capacite, type) VALUES (?, ?, ?)', s.nom, s.capacite, s.type);
  return { ...s, id: r.lastInsertRowId };
}

// --- Enseignants ------------------------------------------------------------

export async function enregistrerEnseignant(
  db: SQLiteDatabase,
  e: Omit<Enseignant, 'id'> & { id?: number },
): Promise<Enseignant> {
  if (e.id) {
    await db.runAsync(
      'UPDATE enseignant SET nom = ?, prenom = ?, email = ?, specialite = ? WHERE id = ?',
      e.nom, e.prenom, e.email, e.specialite, e.id,
    );
    return e as Enseignant;
  }
  const r = await db.runAsync(
    'INSERT INTO enseignant (nom, prenom, email, specialite) VALUES (?, ?, ?, ?)',
    e.nom, e.prenom, e.email, e.specialite,
  );
  return { ...e, id: r.lastInsertRowId };
}

// --- Groupes ----------------------------------------------------------------

export async function enregistrerGroupe(db: SQLiteDatabase, g: Omit<Groupe, 'id'> & { id?: number }): Promise<Groupe> {
  if (g.id) {
    await db.runAsync('UPDATE groupe SET nom = ?, effectif = ?, niveau = ? WHERE id = ?', g.nom, g.effectif, g.niveau, g.id);
    return g as Groupe;
  }
  const r = await db.runAsync('INSERT INTO groupe (nom, effectif, niveau) VALUES (?, ?, ?)', g.nom, g.effectif, g.niveau);
  return { ...g, id: r.lastInsertRowId };
}

/** Suppression d'une ressource ; ses séances partent avec (ON DELETE CASCADE). */
export async function supprimerRessource(
  db: SQLiteDatabase,
  table: 'salle' | 'enseignant' | 'groupe',
  id: number,
): Promise<void> {
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
}

// --- Séances ----------------------------------------------------------------

export async function enregistrerSeance(db: SQLiteDatabase, s: SeanceBrouillon): Promise<Seance> {
  const valeurs = [s.matiere.trim(), s.jour, s.debut, s.fin, s.salleId, s.enseignantId, s.groupeId, s.notes.trim()];
  if (s.id) {
    await db.runAsync(
      `UPDATE seance SET matiere = ?, jour = ?, debut = ?, fin = ?, salle_id = ?,
         enseignant_id = ?, groupe_id = ?, notes = ? WHERE id = ?`,
      [...valeurs, s.id],
    );
    return { ...s, matiere: s.matiere.trim(), notes: s.notes.trim() } as Seance;
  }
  const r = await db.runAsync(
    `INSERT INTO seance (matiere, jour, debut, fin, salle_id, enseignant_id, groupe_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    valeurs,
  );
  return { ...s, id: r.lastInsertRowId, matiere: s.matiere.trim(), notes: s.notes.trim() };
}

export async function supprimerSeance(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM seance WHERE id = ?', id);
}

export async function viderBase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DELETE FROM seance; DELETE FROM salle; DELETE FROM enseignant; DELETE FROM groupe;');
}

/** Jeu de données de démonstration, inséré dans une seule transaction. */
export async function insererDemo(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      INSERT OR IGNORE INTO salle (nom, capacite, type) VALUES
        ('Amphi A', 250, 'Amphi'), ('Salle 101', 40, 'Cours'), ('Salle 102', 40, 'Cours'),
        ('Labo Info 1', 30, 'TP'), ('Salle 201', 60, 'Cours');
      INSERT OR IGNORE INTO enseignant (nom, prenom, email, specialite) VALUES
        ('Mbarga', 'Paul', 'p.mbarga@ecole.cm', 'Mathématiques'),
        ('Ngo Bassa', 'Alice', 'a.ngobassa@ecole.cm', 'Informatique'),
        ('Fotso', 'Jean', 'j.fotso@ecole.cm', 'Physique'),
        ('Tchoumi', 'Marie', 'm.tchoumi@ecole.cm', 'Anglais');
      INSERT OR IGNORE INTO groupe (nom, effectif, niveau) VALUES
        ('L1 Info A', 35, 'Licence 1'), ('L1 Info B', 38, 'Licence 1'), ('L2 Info', 55, 'Licence 2');
    `);
    const id = async (table: string, nom: string) =>
      (await db.getFirstAsync<{ id: number }>(`SELECT id FROM ${table} WHERE nom = ?`, nom))!.id;
    const [amphi, s101, s102, labo, s201] = await Promise.all(
      ['Amphi A', 'Salle 101', 'Salle 102', 'Labo Info 1', 'Salle 201'].map((n) => id('salle', n)),
    );
    const [mbarga, ngo, fotso, tchoumi] = await Promise.all(
      ['Mbarga', 'Ngo Bassa', 'Fotso', 'Tchoumi'].map((n) => id('enseignant', n)),
    );
    const [l1a, l1b, l2] = await Promise.all(['L1 Info A', 'L1 Info B', 'L2 Info'].map((n) => id('groupe', n)));
    const h = (x: number) => Math.round(x * 60);
    const seances: [string, number, number, number, number, number, number][] = [
      ['Analyse', 1, h(8), h(10), s101, mbarga, l1a],
      ['Algorithmique', 1, h(10), h(12), labo, ngo, l1a],
      ['Analyse', 1, h(10), h(12), s102, mbarga, l1b],
      ['Physique', 1, h(13), h(15), s201, fotso, l2],
      ['Anglais', 2, h(8), h(10), s101, tchoumi, l1b],
      ['Algorithmique', 2, h(8), h(10), labo, ngo, l1a],
      ['Bases de données', 2, h(10.5), h(12.5), amphi, ngo, l2],
      ['Physique', 3, h(8), h(10), s201, fotso, l1a],
      ['Algèbre', 3, h(10), h(12), amphi, mbarga, l2],
      ['Anglais', 4, h(14), h(16), s102, tchoumi, l1a],
      ['Programmation web', 5, h(8), h(11), labo, ngo, l1b],
      ['Algèbre', 5, h(13), h(15), s101, mbarga, l1a],
    ];
    for (const [matiere, jour, debut, fin, salle, ens, grp] of seances) {
      await db.runAsync(
        'INSERT INTO seance (matiere, jour, debut, fin, salle_id, enseignant_id, groupe_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        matiere, jour, debut, fin, salle, ens, grp,
      );
    }
  });
}
