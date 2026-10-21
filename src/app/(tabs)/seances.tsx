/** Liste de toutes les séances avec recherche et filtre par jour. */
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SeanceCarte } from '../../components/SeanceCarte';
import { BoutonFlottant, EtatVide, PuceBascule, Puces } from '../../components/ui';
import { nomEnseignant } from '../../domain/conflits';
import { JOURS } from '../../domain/temps';
import { useDonnees } from '../../state/DataContext';
import { couleurs, espace } from '../../theme/theme';

const TOUS = 0;

export default function Seances() {
  const d = useDonnees();
  const [recherche, setRecherche] = useState('');
  const [jour, setJour] = useState<number>(TOUS);
  const [conflitsSeuls, setConflitsSeuls] = useState(false);

  const sections = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const filtrees = d.seances.filter((s) => {
      if (jour !== TOUS && s.jour !== jour) return false;
      if (conflitsSeuls && !d.idsConflit.has(s.id)) return false;
      if (!q) return true;
      const texte = [
        s.matiere,
        d.index.salles.get(s.salleId)?.nom,
        nomEnseignant(d.index.enseignants.get(s.enseignantId)),
        d.index.groupes.get(s.groupeId)?.nom,
      ]
        .join(' ')
        .toLowerCase();
      return texte.includes(q);
    });
    return JOURS.map((j) => ({ title: j.nom, data: filtrees.filter((s) => s.jour === j.valeur) })).filter((x) => x.data.length);
  }, [d.seances, d.index, d.idsConflit, recherche, jour, conflitsSeuls]);

  return (
    <View style={{ flex: 1 }}>
      <View style={st.filtres}>
        <TextInput
          placeholder="Rechercher matière, salle, enseignant, groupe…"
          value={recherche}
          onChangeText={setRecherche}
          style={st.recherche}
          placeholderTextColor={couleurs.texteDoux}
        />
        <Puces
          options={[
            { valeur: TOUS, label: 'Tous' },
            ...JOURS.map((j) => ({ valeur: j.valeur as number, label: j.court })),
          ]}
          valeur={jour}
          onChange={setJour}
        />
        {d.conflits.length > 0 && (
          <PuceBascule label={`Seulement les séances en conflit (${d.idsConflit.size})`} actif={conflitsSeuls} onChange={setConflitsSeuls} />
        )}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={st.liste}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={st.entete}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={{ marginBottom: espace.s }}>
            <SeanceCarte seance={item} index={d.index} enConflit={d.idsConflit.has(item.id)} onPress={() => router.push(`/seance/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <EtatVide icone="calendar-clear-outline" texte={d.seances.length ? 'Aucune séance ne correspond.' : 'Aucune séance. Touchez + pour en créer une.'} />
        }
      />
      <BoutonFlottant label="Nouvelle séance" onPress={() => router.push('/seance/nouvelle')} />
    </View>
  );
}

const st = StyleSheet.create({
  filtres: { padding: espace.l, paddingBottom: espace.s, gap: espace.s },
  recherche: {
    backgroundColor: couleurs.carte,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    paddingHorizontal: espace.m,
    paddingVertical: 10,
    fontSize: 15,
  },
  liste: { paddingHorizontal: espace.l, paddingBottom: 96 },
  entete: { fontSize: 15, fontWeight: '700', color: couleurs.texte, marginTop: espace.m, marginBottom: espace.s },
});
