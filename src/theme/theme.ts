export const couleurs = {
  primaire: '#1E3A8A',
  primaireClair: '#DBEAFE',
  fond: '#F4F6FB',
  carte: '#FFFFFF',
  texte: '#111827',
  texteDoux: '#6B7280',
  bordure: '#E5E7EB',
  danger: '#DC2626',
  dangerClair: '#FEE2E2',
  alerte: '#B45309',
  alerteClair: '#FEF3C7',
  succes: '#047857',
  succesClair: '#D1FAE5',
};

export const espace = { xs: 4, s: 8, m: 12, l: 16, xl: 24 };

/** Palette de pastilles par matière (couleur stable calculée depuis le nom). */
const PALETTE = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#0891B2', '#4F46E5', '#65A30D', '#BE123C', '#0D9488'];

export function couleurMatiere(matiere: string): string {
  let h = 0;
  for (const c of matiere.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
