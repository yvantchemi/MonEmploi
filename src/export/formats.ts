/** Génération des contenus exportés (fonctions pures, testables sans téléphone). */
import { nomEnseignant, type Index } from '../domain/conflits';
import { formatHeure, JOURS, nomJour } from '../domain/temps';
import type { Seance } from '../domain/types';
import { couleurMatiere } from '../theme/theme';

const echapper = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function nomFichier(titre: string, ext: string): string {
  const base = titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${base || 'emploi_du_temps'}.${ext}`;
}

export function genererHtml(titre: string, seances: readonly Seance[], index: Index, idsConflit: Set<number>): string {
  const colonnes = JOURS.map((j) => {
    const duJour = seances.filter((s) => s.jour === j.valeur).sort((a, b) => a.debut - b.debut);
    const blocs = duJour
      .map(
        (s) => `<div class="bloc${idsConflit.has(s.id) ? ' conflit' : ''}" style="border-left-color:${couleurMatiere(s.matiere)}">
          <div class="h">${formatHeure(s.debut)} – ${formatHeure(s.fin)}</div>
          <div class="m">${echapper(s.matiere)}</div>
          <div class="d">${echapper(index.salles.get(s.salleId)?.nom ?? '')}</div>
          <div class="d">${echapper(nomEnseignant(index.enseignants.get(s.enseignantId)))}</div>
          <div class="d">${echapper(index.groupes.get(s.groupeId)?.nom ?? '')}</div>
        </div>`,
      )
      .join('');
    return `<td>${blocs || '<div class="libre">—</div>'}</td>`;
  }).join('');

  const date = new Date().toLocaleDateString('fr-FR');
  const nbConflits = seances.filter((s) => idsConflit.has(s.id)).length;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color:#111827; }
    h1 { font-size: 20px; margin: 0 0 4px; color:#1E3A8A; }
    .meta { font-size: 11px; color:#6B7280; margin-bottom: 10px; }
    table { width:100%; border-collapse: collapse; table-layout: fixed; }
    th { background:#1E3A8A; color:#fff; font-size:12px; padding:6px; }
    td { vertical-align: top; border:1px solid #E5E7EB; padding:4px; }
    .bloc { border-left:4px solid #2563EB; background:#F4F6FB; border-radius:4px; padding:4px 6px; margin-bottom:4px; page-break-inside: avoid; }
    .bloc.conflit { background:#FEE2E2; outline:1px solid #DC2626; }
    .h { font-size:10px; font-weight:700; }
    .m { font-size:11px; font-weight:700; margin:2px 0; }
    .d { font-size:9px; color:#374151; }
    .libre { color:#9CA3AF; text-align:center; font-size:11px; padding:8px; }
  </style></head><body>
  <h1>${echapper(titre)}</h1>
  <div class="meta">MonEmploi · généré le ${date} · ${seances.length} séance(s)${nbConflits ? ` · <b style="color:#DC2626">${nbConflits} en conflit</b>` : ''}</div>
  <table><tr>${JOURS.map((j) => `<th>${j.nom}</th>`).join('')}</tr><tr>${colonnes}</tr></table>
  </body></html>`;
}

export function genererCsv(seances: readonly Seance[], index: Index, idsConflit: Set<number>): string {
  const cellule = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const entete = ['Jour', 'Début', 'Fin', 'Matière', 'Salle', 'Enseignant', 'Groupe', 'Conflit', 'Notes'];
  const lignes = [...seances]
    .sort((a, b) => a.jour - b.jour || a.debut - b.debut)
    .map((s) =>
      [
        nomJour(s.jour),
        formatHeure(s.debut),
        formatHeure(s.fin),
        s.matiere,
        index.salles.get(s.salleId)?.nom ?? '',
        nomEnseignant(index.enseignants.get(s.enseignantId)),
        index.groupes.get(s.groupeId)?.nom ?? '',
        idsConflit.has(s.id) ? 'OUI' : '',
        s.notes,
      ]
        .map(cellule)
        .join(';'),
    );
  // BOM UTF-8 + séparateur « ; » : ouverture directe et correcte dans Excel en français.
  return '﻿' + [entete.join(';'), ...lignes].join('\r\n');
}
