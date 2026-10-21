/** Modèle métier de MonEmploi. Les heures sont stockées en minutes depuis minuit. */

export type Jour = 1 | 2 | 3 | 4 | 5 | 6; // 1 = Lundi … 6 = Samedi

export interface Salle {
  id: number;
  nom: string;
  capacite: number;
  type: string; // ex. "Amphi", "TP", "Cours"
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite: string;
}

export interface Groupe {
  id: number;
  nom: string;
  effectif: number;
  niveau: string;
}

export interface Seance {
  id: number;
  matiere: string;
  jour: Jour;
  debut: number; // minutes depuis minuit
  fin: number;
  salleId: number;
  enseignantId: number;
  groupeId: number;
  notes: string;
}

/** Séance en cours d'édition (pas encore d'id si nouvelle). */
export type SeanceBrouillon = Omit<Seance, 'id'> & { id?: number };

export type TypeRessource = 'salle' | 'enseignant' | 'groupe';

export type TypeConflit = TypeRessource | 'capacite';

export interface Conflit {
  type: TypeConflit;
  /** Séance existante en collision (absente pour un conflit de capacité). */
  avec?: Seance;
  message: string;
  /** true = bloquant (double réservation), false = simple avertissement. */
  bloquant: boolean;
}
