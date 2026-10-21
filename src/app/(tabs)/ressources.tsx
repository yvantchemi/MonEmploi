/** Gestion des salles, enseignants et groupes. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BoutonFlottant, EtatVide, Puces, type NomIcone } from '../../components/ui';
import { nomEnseignant } from '../../domain/conflits';
import type { TypeRessource } from '../../domain/types';
import { useDonnees } from '../../state/DataContext';
import { couleurs, espace } from '../../theme/theme';

const ICONES: Record<TypeRessource, NomIcone> = { salle: 'business-outline', enseignant: 'person-outline', groupe: 'people-outline' };

export default function Ressources() {
  const d = useDonnees();
  const { onglet: param } = useLocalSearchParams<{ onglet?: TypeRessource }>();
  const [onglet, setOnglet] = useState<TypeRessource>(param ?? 'salle');
  // Onglet imposé depuis l'accueil : ajusté pendant le rendu (pas d'effet).
  const [paramPrecedent, setParamPrecedent] = useState(param);
  if (param !== paramPrecedent) {
    setParamPrecedent(param);
    if (param) setOnglet(param);
  }

  // Nombre de séances par ressource, calculé en une passe.
  const usages = useMemo(() => {
    const c = { salle: new Map<number, number>(), enseignant: new Map<number, number>(), groupe: new Map<number, number>() };
    const inc = (m: Map<number, number>, k: number) => m.set(k, (m.get(k) ?? 0) + 1);
    for (const s of d.seances) {
      inc(c.salle, s.salleId);
      inc(c.enseignant, s.enseignantId);
      inc(c.groupe, s.groupeId);
    }
    return c;
  }, [d.seances]);

  const lignes = useMemo(() => {
    if (onglet === 'salle') return d.salles.map((s) => ({ id: s.id, titre: s.nom, sous: `${s.type || 'Salle'} · ${s.capacite} places` }));
    if (onglet === 'enseignant')
      return d.enseignants.map((e) => ({ id: e.id, titre: nomEnseignant(e), sous: [e.specialite, e.email].filter(Boolean).join(' · ') }));
    return d.groupes.map((g) => ({ id: g.id, titre: g.nom, sous: `${g.niveau || 'Groupe'} · ${g.effectif} élèves` }));
  }, [onglet, d.salles, d.enseignants, d.groupes]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: espace.l, paddingBottom: espace.s }}>
        <Puces
          defilement={false}
          options={[
            { valeur: 'salle', label: `Salles (${d.salles.length})` },
            { valeur: 'enseignant', label: `Enseignants (${d.enseignants.length})` },
            { valeur: 'groupe', label: `Groupes (${d.groupes.length})` },
          ]}
          valeur={onglet}
          onChange={(v) => setOnglet(v as TypeRessource)}
        />
      </View>
      <FlatList
        data={lignes}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={{ paddingHorizontal: espace.l, paddingBottom: 96, gap: espace.s }}
        ListEmptyComponent={<EtatVide icone={ICONES[onglet]} texte="Rien pour l'instant. Touchez + pour ajouter." />}
        renderItem={({ item }) => {
          const n = usages[onglet].get(item.id) ?? 0;
          return (
            <Pressable style={({ pressed }) => [st.ligne, pressed && { opacity: 0.85 }]} onPress={() => router.push(`/ressource/${onglet}/${item.id}`)}>
              <View style={st.icone}>
                <Ionicons name={ICONES[onglet]} size={20} color={couleurs.primaire} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.titre}>{item.titre}</Text>
                {!!item.sous && <Text style={st.sous}>{item.sous}</Text>}
              </View>
              <Text style={st.compte}>{n} séance{n > 1 ? 's' : ''}</Text>
              <Ionicons name="chevron-forward" size={18} color={couleurs.texteDoux} />
            </Pressable>
          );
        }}
      />
      <BoutonFlottant label="Ajouter" onPress={() => router.push(`/ressource/${onglet}/nouvelle`)} />
    </View>
  );
}

const st = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.m,
    backgroundColor: couleurs.carte,
    borderRadius: 12,
    padding: espace.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: couleurs.bordure,
  },
  icone: { width: 38, height: 38, borderRadius: 19, backgroundColor: couleurs.primaireClair, alignItems: 'center', justifyContent: 'center' },
  titre: { fontSize: 15, fontWeight: '700', color: couleurs.texte },
  sous: { fontSize: 13, color: couleurs.texteDoux, marginTop: 2 },
  compte: { fontSize: 12, color: couleurs.texteDoux },
});
