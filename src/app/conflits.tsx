/** Liste de tous les conflits présents dans l'emploi du temps. */
import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SeanceCarte } from '../components/SeanceCarte';
import { Badge, Carte, EtatVide } from '../components/ui';
import { nomEnseignant } from '../domain/conflits';
import { formatCreneau } from '../domain/temps';
import { useDonnees } from '../state/DataContext';
import { couleurs, espace } from '../theme/theme';

export default function Conflits() {
  const d = useDonnees();
  return (
    <FlatList
      data={d.conflits}
      keyExtractor={(p) => `${p.a.id}-${p.b.id}`}
      contentContainerStyle={{ padding: espace.l, gap: espace.m }}
      ListHeaderComponent={
        d.conflits.length ? (
          <Text style={st.intro}>Touchez une séance pour la modifier et résoudre le conflit.</Text>
        ) : undefined
      }
      ListEmptyComponent={<EtatVide icone="checkmark-circle-outline" texte="Aucun conflit : aucune salle, aucun enseignant ni aucun groupe n'est réservé deux fois." />}
      renderItem={({ item: p }) => {
        const debut = Math.max(p.a.debut, p.b.debut);
        const fin = Math.min(p.a.fin, p.b.fin);
        const raisons = p.types.map((t) =>
          t === 'salle'
            ? `Salle : ${d.index.salles.get(p.a.salleId)?.nom ?? ''}`
            : t === 'enseignant'
              ? `Enseignant : ${nomEnseignant(d.index.enseignants.get(p.a.enseignantId))}`
              : `Groupe : ${d.index.groupes.get(p.a.groupeId)?.nom ?? ''}`,
        );
        return (
          <Carte style={{ gap: espace.s }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espace.xs }}>
              {raisons.map((r) => (
                <Badge key={r} texte={r} couleur={couleurs.danger} fond={couleurs.dangerClair} />
              ))}
            </View>
            <Text style={st.chevauchement}>Chevauchement : {formatCreneau(p.a.jour, debut, fin)}</Text>
            <SeanceCarte seance={p.a} index={d.index} enConflit onPress={() => router.push(`/seance/${p.a.id}`)} />
            <SeanceCarte seance={p.b} index={d.index} enConflit onPress={() => router.push(`/seance/${p.b.id}`)} />
          </Carte>
        );
      }}
    />
  );
}

const st = StyleSheet.create({
  intro: { color: couleurs.texteDoux },
  chevauchement: { fontSize: 13, fontWeight: '600', color: couleurs.texte },
});
