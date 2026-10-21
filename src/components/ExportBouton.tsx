import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import type { Seance } from '../domain/types';
import { exporterCsv, exporterPdf } from '../export/export';
import { useDonnees } from '../state/DataContext';
import { espace } from '../theme/theme';
import { Bouton } from './ui';

/** Deux boutons PDF / CSV exportant la liste de séances fournie. */
export function ExportBoutons({ titre, seances }: { titre: string; seances: readonly Seance[] }) {
  const { index, idsConflit } = useDonnees();
  const [enCours, setEnCours] = useState(false);

  const lancer = async (format: 'pdf' | 'csv') => {
    if (!seances.length) {
      Alert.alert('Export', 'Aucune séance à exporter.');
      return;
    }
    setEnCours(true);
    try {
      await (format === 'pdf' ? exporterPdf : exporterCsv)(titre, seances, index, idsConflit);
    } catch (e) {
      Alert.alert("Échec de l'export", e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: espace.s }}>
      <Bouton titre="PDF" icone="document-text-outline" variante="secondaire" desactive={enCours} onPress={() => lancer('pdf')} style={{ flex: 1 }} />
      <Bouton titre="CSV / Excel" icone="grid-outline" variante="secondaire" desactive={enCours} onPress={() => lancer('csv')} style={{ flex: 1 }} />
    </View>
  );
}
