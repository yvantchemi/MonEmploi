/**
 * Moteur de détection de conflits.
 *
 * Fonctions pures (aucun accès base de données) : elles travaillent sur les
 * données déjà chargées en mémoire, ce qui permet une détection instantanée
 * pendant la saisie sans aucune requête supplémentaire.
 */
import { chevauche, formatCreneau } from './temps';
import type { Conflit, Enseignant, Groupe, Salle, Seance, SeanceBrouillon } from './types';

export interface Index {
  salles: Map<number, Salle>;
  enseignants: Map<number, Enseignant>;
  groupes: Map<number, Groupe>;
}

export function nomEnseignant(e?: Enseignant): string {
  return e ? `${e.prenom} ${e.nom}`.trim() : 'Enseignant supprimé';
}

/** Erreurs de saisie qui empêchent tout enregistrement. */
export function validerSeance(s: Partial<SeanceBrouillon>): string[] {
  const erreurs: string[] = [];
  if (!s.matiere || !s.matiere.trim()) erreurs.push('La matière est obligatoire.');
  if (!s.jour) erreurs.push('Choisissez un jour.');
  if (s.debut == null || s.fin == null) erreurs.push('Indiquez les heures de début et de fin.');
  else if (s.fin <= s.debut) erreurs.push("L'heure de fin doit être après l'heure de début.");
  if (!s.salleId) erreurs.push('Choisissez une salle.');
  if (!s.enseignantId) erreurs.push('Choisissez un enseignant.');
  if (!s.groupeId) erreurs.push('Choisissez un groupe.');
  return erreurs;
}

/**
 * Conflits d'une séance (nouvelle ou modifiée) par rapport aux séances existantes.
 * Une séance ne se compare jamais à elle-même (même id).
 */
export function detecterConflits(
  s: SeanceBrouillon,
  seances: readonly Seance[],
  index: Index,
): Conflit[] {
  const conflits: Conflit[] = [];

  for (const autre of seances) {
    if (autre.id === s.id || autre.jour !== s.jour) continue;
    if (!chevauche(s.debut, s.fin, autre.debut, autre.fin)) continue;

    const creneau = formatCreneau(autre.jour, autre.debut, autre.fin);
    if (autre.salleId === s.salleId) {
      conflits.push({
        type: 'salle',
        avec: autre,
        bloquant: true,
        message: `« ${index.salles.get(s.salleId)?.nom ?? 'Salle'} » déjà occupée (${autre.matiere}, ${creneau}).`,
      });
    }
    if (autre.enseignantId === s.enseignantId) {
      conflits.push({
        type: 'enseignant',
        avec: autre,
        bloquant: true,
        message: `${nomEnseignant(index.enseignants.get(s.enseignantId))} enseigne déjà ${autre.matiere} (${creneau}).`,
      });
    }
    if (autre.groupeId === s.groupeId) {
      conflits.push({
        type: 'groupe',
        avec: autre,
        bloquant: true,
        message: `Le groupe « ${index.groupes.get(s.groupeId)?.nom ?? ''} » a déjà ${autre.matiere} (${creneau}).`,
      });
    }
  }

  const salle = index.salles.get(s.salleId);
  const groupe = index.groupes.get(s.groupeId);
  if (salle && groupe && salle.capacite > 0 && groupe.effectif > salle.capacite) {
    conflits.push({
      type: 'capacite',
      bloquant: false,
      message: `Capacité insuffisante : ${groupe.effectif} élèves pour ${salle.capacite} places en « ${salle.nom} ».`,
    });
  }

  return conflits;
}

export interface PaireEnConflit {
  a: Seance;
  b: Seance;
  types: ('salle' | 'enseignant' | 'groupe')[];
}

/**
 * Tous les conflits de l'emploi du temps.
 * Balayage par jour trié par heure de début : on ne compare une séance qu'aux
 * séances encore « ouvertes », soit O(n log n + k) au lieu de O(n²).
 */
export function tousLesConflits(seances: readonly Seance[]): PaireEnConflit[] {
  const triees = [...seances].sort((x, y) => x.jour - y.jour || x.debut - y.debut);
  const resultat: PaireEnConflit[] = [];
  let ouvertes: Seance[] = [];

  for (const s of triees) {
    ouvertes = ouvertes.filter((o) => o.jour === s.jour && o.fin > s.debut);
    for (const o of ouvertes) {
      const types: PaireEnConflit['types'] = [];
      if (o.salleId === s.salleId) types.push('salle');
      if (o.enseignantId === s.enseignantId) types.push('enseignant');
      if (o.groupeId === s.groupeId) types.push('groupe');
      if (types.length) resultat.push({ a: o, b: s, types });
    }
    ouvertes.push(s);
  }
  return resultat;
}

/** Ids des séances impliquées dans au moins un conflit (pour les signaler en rouge). */
export function idsEnConflit(paires: readonly PaireEnConflit[]): Set<number> {
  const ids = new Set<number>();
  for (const p of paires) {
    ids.add(p.a.id);
    ids.add(p.b.id);
  }
  return ids;
}

/** Salles libres sur le créneau de la séance, assez grandes pour le groupe, triées par capacité. */
export function sallesLibres(
  s: SeanceBrouillon,
  seances: readonly Seance[],
  salles: readonly Salle[],
  effectif: number,
): Salle[] {
  const occupees = new Set(
    seances
      .filter((o) => o.id !== s.id && o.jour === s.jour && chevauche(s.debut, s.fin, o.debut, o.fin))
      .map((o) => o.salleId),
  );
  return salles
    .filter((sa) => !occupees.has(sa.id) && (sa.capacite === 0 || sa.capacite >= effectif))
    .sort((x, y) => x.capacite - y.capacite);
}
