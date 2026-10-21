/** Champs de sélection en fenêtre modale : liste filtrable et choix d'heure. */
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatHeure, HEURE_MAX, HEURE_MIN, PAS_MINUTES } from '../domain/temps';
import { couleurs, espace } from '../theme/theme';
import { Bouton, Label, Puces } from './ui';

export interface OptionListe {
  id: number;
  titre: string;
  sousTitre?: string;
  /** Option marquée comme indisponible (ex. salle occupée), reste sélectionnable. */
  alerte?: string;
}

function Declencheur({ label, texte, onPress, vide }: { label: string; texte: string; onPress: () => void; vide?: boolean }) {
  return (
    <View style={{ marginBottom: espace.m }}>
      <Label>{label}</Label>
      <Pressable onPress={onPress} style={s.declencheur} accessibilityRole="button" accessibilityLabel={label}>
        <Text style={[s.declencheurTexte, vide && { color: couleurs.texteDoux }]} numberOfLines={1}>
          {texte}
        </Text>
        <Ionicons name="chevron-down" size={18} color={couleurs.texteDoux} />
      </Pressable>
    </View>
  );
}

export function ChampListe({
  label,
  options,
  valeur,
  onChange,
  onCreer,
}: {
  label: string;
  options: OptionListe[];
  valeur: number | undefined;
  onChange: (id: number) => void;
  onCreer?: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [filtre, setFiltre] = useState('');
  const choisie = options.find((o) => o.id === valeur);
  const filtrees = useMemo(() => {
    const f = filtre.trim().toLowerCase();
    return f ? options.filter((o) => `${o.titre} ${o.sousTitre ?? ''}`.toLowerCase().includes(f)) : options;
  }, [options, filtre]);

  return (
    <>
      <Declencheur label={label} texte={choisie?.titre ?? 'Choisir…'} vide={!choisie} onPress={() => setOuvert(true)} />
      <Modal visible={ouvert} animationType="slide" onRequestClose={() => setOuvert(false)}>
        <SafeAreaView style={s.modal}>
          <View style={s.entete}>
            <Text style={s.enteteTitre}>{label}</Text>
            <Pressable onPress={() => setOuvert(false)} hitSlop={12} accessibilityLabel="Fermer">
              <Ionicons name="close" size={26} color={couleurs.texte} />
            </Pressable>
          </View>
          <TextInput
            placeholder="Rechercher…"
            value={filtre}
            onChangeText={setFiltre}
            style={s.recherche}
            placeholderTextColor={couleurs.texteDoux}
          />
          <FlatList
            data={filtrees}
            keyExtractor={(o) => String(o.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={s.aucun}>Aucun élément.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={[s.ligne, item.id === valeur && { backgroundColor: couleurs.primaireClair }]}
                onPress={() => {
                  onChange(item.id);
                  setOuvert(false);
                  setFiltre('');
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.ligneTitre}>{item.titre}</Text>
                  {!!item.sousTitre && <Text style={s.ligneSous}>{item.sousTitre}</Text>}
                </View>
                {item.alerte ? (
                  <Text style={s.alerte}>{item.alerte}</Text>
                ) : (
                  item.id === valeur && <Ionicons name="checkmark" size={20} color={couleurs.primaire} />
                )}
              </Pressable>
            )}
          />
          {onCreer && (
            <View style={{ padding: espace.l }}>
              <Bouton
                titre="Créer un nouvel élément"
                icone="add"
                variante="secondaire"
                onPress={() => {
                  setOuvert(false);
                  onCreer();
                }}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const HEURES = Array.from(
  { length: (HEURE_MAX - HEURE_MIN) / 60 + 1 },
  (_, i) => HEURE_MIN / 60 + i,
);
const MINUTES = Array.from({ length: 60 / PAS_MINUTES }, (_, i) => i * PAS_MINUTES);

export function ChampHeure({ label, valeur, onChange }: { label: string; valeur: number; onChange: (m: number) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const h = Math.floor(valeur / 60);
  const m = valeur % 60;
  return (
    <>
      <Declencheur label={label} texte={formatHeure(valeur)} onPress={() => setOuvert(true)} />
      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={() => setOuvert(false)}>
        <Pressable style={s.voile} onPress={() => setOuvert(false)}>
          <Pressable style={s.boite} onPress={() => {}}>
            <Text style={s.enteteTitre}>
              {label} : {formatHeure(valeur)}
            </Text>
            <Label>Heure</Label>
            <Puces defilement={false} options={HEURES.map((x) => ({ valeur: x, label: `${x}h` }))} valeur={h} onChange={(x) => onChange(x * 60 + m)} />
            <View style={{ height: espace.m }} />
            <Label>Minutes</Label>
            <Puces defilement={false} options={MINUTES.map((x) => ({ valeur: x, label: String(x).padStart(2, '0') }))} valeur={m} onChange={(x) => onChange(h * 60 + x)} />
            <Bouton titre="Valider" onPress={() => setOuvert(false)} style={{ marginTop: espace.l }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  declencheur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: couleurs.carte,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: 10,
    paddingHorizontal: espace.m,
    paddingVertical: 12,
  },
  declencheurTexte: { fontSize: 15, color: couleurs.texte, flex: 1 },
  modal: { flex: 1, backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: espace.l },
  enteteTitre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espace.m },
  recherche: {
    marginHorizontal: espace.l,
    marginBottom: espace.s,
    backgroundColor: couleurs.carte,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    paddingHorizontal: espace.m,
    paddingVertical: 10,
    fontSize: 15,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espace.l,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.carte,
  },
  ligneTitre: { fontSize: 15, fontWeight: '600', color: couleurs.texte },
  ligneSous: { fontSize: 13, color: couleurs.texteDoux, marginTop: 2 },
  alerte: { fontSize: 12, color: couleurs.danger, fontWeight: '600' },
  aucun: { textAlign: 'center', color: couleurs.texteDoux, padding: espace.xl },
  voile: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: espace.l },
  boite: { backgroundColor: couleurs.fond, borderRadius: 16, padding: espace.l },
});
