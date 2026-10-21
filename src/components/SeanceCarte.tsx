import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nomEnseignant, type Index } from '../domain/conflits';
import { formatHeure, nomJour } from '../domain/temps';
import type { Seance } from '../domain/types';
import { couleurMatiere, couleurs, espace } from '../theme/theme';

/** Carte d'une séance. `masquer` cache l'info redondante dans une vue filtrée. */
export function SeanceCarte({
  seance,
  index,
  enConflit,
  onPress,
  afficherJour,
  masquer,
}: {
  seance: Seance;
  index: Index;
  enConflit?: boolean;
  onPress?: () => void;
  afficherJour?: boolean;
  masquer?: 'salle' | 'enseignant' | 'groupe';
}) {
  const couleur = couleurMatiere(seance.matiere);
  const details: { icone: React.ComponentProps<typeof Ionicons>['name']; texte: string; cle: string }[] = [
    { cle: 'salle', icone: 'business-outline', texte: index.salles.get(seance.salleId)?.nom ?? '—' },
    { cle: 'enseignant', icone: 'person-outline', texte: nomEnseignant(index.enseignants.get(seance.enseignantId)) },
    { cle: 'groupe', icone: 'people-outline', texte: index.groupes.get(seance.groupeId)?.nom ?? '—' },
  ];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.carte,
        { borderLeftColor: couleur },
        enConflit && s.conflit,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${seance.matiere}, ${nomJour(seance.jour)} ${formatHeure(seance.debut)} à ${formatHeure(seance.fin)}${enConflit ? ', en conflit' : ''}`}
    >
      <View style={s.horaire}>
        {afficherJour && <Text style={s.jour}>{nomJour(seance.jour).slice(0, 3)}</Text>}
        <Text style={s.heure}>{formatHeure(seance.debut)}</Text>
        <Text style={s.heureFin}>{formatHeure(seance.fin)}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.matiere} numberOfLines={1}>
            {seance.matiere}
          </Text>
          {enConflit && <Ionicons name="warning" size={16} color={couleurs.danger} />}
        </View>
        {details
          .filter((d) => d.cle !== masquer)
          .map((d) => (
            <View key={d.cle} style={s.detail}>
              <Ionicons name={d.icone} size={14} color={couleurs.texteDoux} />
              <Text style={s.detailTexte} numberOfLines={1}>
                {d.texte}
              </Text>
            </View>
          ))}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    gap: espace.m,
    backgroundColor: couleurs.carte,
    borderRadius: 12,
    padding: espace.m,
    borderLeftWidth: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: couleurs.bordure,
  },
  conflit: { backgroundColor: couleurs.dangerClair, borderColor: couleurs.danger },
  horaire: { width: 52, alignItems: 'center' },
  jour: { fontSize: 12, fontWeight: '700', color: couleurs.primaire, textTransform: 'uppercase' },
  heure: { fontSize: 15, fontWeight: '700', color: couleurs.texte },
  heureFin: { fontSize: 13, color: couleurs.texteDoux },
  matiere: { fontSize: 16, fontWeight: '700', color: couleurs.texte, flexShrink: 1 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailTexte: { fontSize: 13, color: couleurs.texteDoux, flexShrink: 1 },
});
