/**
 * Export de l'emploi du temps en PDF (expo-print) et en CSV (expo-file-system),
 * puis partage via la feuille de partage du système (expo-sharing).
 * Tout est généré localement : aucune requête réseau.
 */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Index } from '../domain/conflits';
import type { Seance } from '../domain/types';
import { genererCsv, genererHtml, nomFichier } from './formats';

export async function exporterPdf(titre: string, seances: readonly Seance[], index: Index, idsConflit: Set<number>) {
  const { uri } = await Print.printToFileAsync({ html: genererHtml(titre, seances, index, idsConflit) });
  // Renomme le fichier temporaire avec un nom lisible avant le partage.
  const cible = new File(Paths.cache, nomFichier(titre, 'pdf'));
  if (cible.exists) cible.delete();
  new File(uri).moveSync(cible);
  await partager(cible.uri, 'application/pdf', 'com.adobe.pdf');
}

export async function exporterCsv(titre: string, seances: readonly Seance[], index: Index, idsConflit: Set<number>) {
  const fichier = new File(Paths.cache, nomFichier(titre, 'csv'));
  if (fichier.exists) fichier.delete();
  fichier.create();
  fichier.writeSync(genererCsv(seances, index, idsConflit));
  await partager(fichier.uri, 'text/csv', 'public.comma-separated-values-text');
}

async function partager(uri: string, mimeType: string, UTI: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage n'est pas disponible sur cet appareil.");
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle: 'Exporter l’emploi du temps' });
}
