/** Composants d'interface réutilisables. */
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { couleurs, espace } from '../theme/theme';

export type NomIcone = React.ComponentProps<typeof Ionicons>['name'];

export function Carte({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.carte, style]}>{children}</View>;
}

export function Titre({ children }: { children: React.ReactNode }) {
  return <Text style={styles.titre}>{children}</Text>;
}

type Variante = 'primaire' | 'secondaire' | 'danger';

export function Bouton({
  titre,
  onPress,
  variante = 'primaire',
  icone,
  desactive,
  style,
}: {
  titre: string;
  onPress: () => void;
  variante?: Variante;
  icone?: NomIcone;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fond = { primaire: couleurs.primaire, secondaire: couleurs.primaireClair, danger: couleurs.dangerClair }[variante];
  const texte = { primaire: '#fff', secondaire: couleurs.primaire, danger: couleurs.danger }[variante];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desactive}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond, opacity: desactive ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {icone && <Ionicons name={icone} size={18} color={texte} />}
      <Text style={[styles.boutonTexte, { color: texte }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: espace.m }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={couleurs.texteDoux} style={styles.input} {...props} />
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Sélecteur à pastilles (une seule valeur). */
export function Puces<T extends string | number>({
  options,
  valeur,
  onChange,
  defilement = true,
}: {
  options: { valeur: T; label: string }[];
  valeur: T | undefined;
  onChange: (v: T) => void;
  defilement?: boolean;
}) {
  const contenu = options.map((o) => {
    const actif = o.valeur === valeur;
    return (
      <Pressable
        key={String(o.valeur)}
        onPress={() => onChange(o.valeur)}
        style={[styles.puce, actif && styles.puceActive]}
        accessibilityState={{ selected: actif }}
      >
        <Text style={[styles.puceTexte, actif && { color: '#fff' }]}>{o.label}</Text>
      </Pressable>
    );
  });
  if (!defilement) return <View style={styles.pucesWrap}>{contenu}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: espace.s, alignItems: 'center' }}>
      {contenu}
    </ScrollView>
  );
}

/** Pastille interrupteur (activée / désactivée). */
export function PuceBascule({ label, actif, onChange }: { label: string; actif: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!actif)}
      style={[styles.puce, { alignSelf: 'flex-start' }, actif && { backgroundColor: couleurs.danger, borderColor: couleurs.danger }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: actif }}
    >
      <Text style={[styles.puceTexte, actif && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function EtatVide({ icone, texte, children }: { icone: NomIcone; texte: string; children?: React.ReactNode }) {
  return (
    <View style={styles.vide}>
      <Ionicons name={icone} size={48} color={couleurs.texteDoux} />
      <Text style={styles.videTexte}>{texte}</Text>
      {children}
    </View>
  );
}

export function Badge({ texte, couleur, fond }: { texte: string; couleur: string; fond: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: fond }]}>
      <Text style={[styles.badgeTexte, { color: couleur }]}>{texte}</Text>
    </View>
  );
}

/** Bouton flottant d'ajout. */
export function BoutonFlottant({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}>
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.carte,
    borderRadius: 12,
    padding: espace.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: couleurs.bordure,
  },
  titre: { fontSize: 17, fontWeight: '700', color: couleurs.texte, marginBottom: espace.s },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espace.s,
    paddingVertical: 12,
    paddingHorizontal: espace.l,
    borderRadius: 10,
  },
  boutonTexte: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteDoux, marginBottom: espace.xs },
  input: {
    backgroundColor: couleurs.carte,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: 10,
    paddingHorizontal: espace.m,
    paddingVertical: 10,
    fontSize: 15,
    color: couleurs.texte,
  },
  pucesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: espace.s },
  puce: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: couleurs.carte,
    borderWidth: 1,
    borderColor: couleurs.bordure,
  },
  puceActive: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  puceTexte: { fontSize: 14, color: couleurs.texte, fontWeight: '500' },
  vide: { alignItems: 'center', padding: espace.xl, gap: espace.m },
  videTexte: { color: couleurs.texteDoux, textAlign: 'center', fontSize: 15 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeTexte: { fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: espace.l,
    bottom: espace.l,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: couleurs.primaire,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
