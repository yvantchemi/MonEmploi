import type { Jour } from './types';

export const JOURS: { valeur: Jour; nom: string; court: string }[] = [
  { valeur: 1, nom: 'Lundi', court: 'Lun' },
  { valeur: 2, nom: 'Mardi', court: 'Mar' },
  { valeur: 3, nom: 'Mercredi', court: 'Mer' },
  { valeur: 4, nom: 'Jeudi', court: 'Jeu' },
  { valeur: 5, nom: 'Vendredi', court: 'Ven' },
  { valeur: 6, nom: 'Samedi', court: 'Sam' },
];

/** Plage horaire proposée à la saisie. */
export const HEURE_MIN = 7 * 60;
export const HEURE_MAX = 21 * 60;
export const PAS_MINUTES = 15;

export function nomJour(jour: number): string {
  return JOURS.find((j) => j.valeur === jour)?.nom ?? '?';
}

/** 485 -> "08:05" */
export function formatHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "08:05" -> 485 ; renvoie null si le format est invalide. */
export function parseHeure(texte: string): number | null {
  const r = /^(\d{1,2}):(\d{2})$/.exec(texte.trim());
  if (!r) return null;
  const h = Number(r[1]);
  const m = Number(r[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatCreneau(jour: number, debut: number, fin: number): string {
  return `${nomJour(jour)} ${formatHeure(debut)}–${formatHeure(fin)}`;
}

/** Deux intervalles [a, b[ et [c, d[ se chevauchent-ils ? (bornes adjacentes = pas de conflit) */
export function chevauche(debutA: number, finA: number, debutB: number, finB: number): boolean {
  return debutA < finB && debutB < finA;
}

/** Jour courant de la semaine (1..6), dimanche ramené au lundi. */
export function jourCourant(): Jour {
  const d = new Date().getDay(); // 0 = dimanche
  return (d === 0 ? 1 : d) as Jour;
}
