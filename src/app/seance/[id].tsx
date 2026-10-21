/**
 * Création / modification d'une séance avec détection des conflits en direct.
 * La détection se fait en mémoire à chaque changement : aucune requête n'est
 * envoyée à la base avant l'enregistrement.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { fermer } from '../../navigation';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChampHeure, ChampListe, type OptionListe } from '../../components/Selecteurs';
import { Bouton, Champ, Label, Puces } from '../../components/ui';
import { detecterConflits, nomEnseignant, sallesLibres, validerSeance } from '../../domain/conflits';
import { chevauche, formatHeure, HEURE_MAX, jourCourant, JOURS } from '../../domain/temps';
import type { Jour, SeanceBrouillon } from '../../domain/types';
import { useDonnees } from '../../state/DataContext';
import { couleurs, espace } from '../../theme/theme';

const DUREES = [60, 90, 120, 180];

export default function EditionSeance() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = useDonnees();
  const existante = id === 'nouvelle' ? undefined : d.seances.find((s) => s.id === Number(id));

  const [s, setS] = useState<SeanceBrouillon>(
    () =>
      existante ?? {
        matiere: '',
        jour: jourCourant(),
        debut: 8 * 60,
        fin: 10 * 60,
        salleId: 0,
        enseignantId: 0,
        groupeId: 0,
        notes: '',
      },
  );
  const [enCours, setEnCours] = useState(false);
  const maj = (p: Partial<SeanceBrouillon>) => setS((x) => ({ ...x, ...p }));

  const conflits = useMemo(
    () => (s.fin > s.debut ? detecterConflits(s, d.seances, d.index) : []),
    [s, d.seances, d.index],
  );
  const bloquants = conflits.filter((c) => c.bloquant);
  const avertissements = conflits.filter((c) => !c.bloquant);

  // Ressources occupées sur le créneau courant (pour annoter les listes).
  const occupees = useMemo(() => {
    const r = { salle: new Set<number>(), enseignant: new Set<number>(), groupe: new Set<number>() };
    for (const o of d.seances) {
      if (o.id === s.id || o.jour !== s.jour || !chevauche(s.debut, s.fin, o.debut, o.fin)) continue;
      r.salle.add(o.salleId);
      r.enseignant.add(o.enseignantId);
      r.groupe.add(o.groupeId);
    }
    return r;
  }, [d.seances, s.id, s.jour, s.debut, s.fin]);

  const optSalles: OptionListe[] = d.salles.map((x) => ({
    id: x.id,
    titre: x.nom,
    sousTitre: `${x.type || 'Salle'} · ${x.capacite} places`,
    alerte: occupees.salle.has(x.id) ? 'Occupée' : undefined,
  }));
  const optEnseignants: OptionListe[] = d.enseignants.map((x) => ({
    id: x.id,
    titre: nomEnseignant(x),
    sousTitre: x.specialite,
    alerte: occupees.enseignant.has(x.id) ? 'Occupé·e' : undefined,
  }));
  const optGroupes: OptionListe[] = d.groupes.map((x) => ({
    id: x.id,
    titre: x.nom,
    sousTitre: `${x.niveau} · ${x.effectif} élèves`,
    alerte: occupees.groupe.has(x.id) ? 'Occupé' : undefined,
  }));

  const effectif = d.index.groupes.get(s.groupeId)?.effectif ?? 0;
  const suggestions = useMemo(
    () =>
      conflits.some((c) => c.type === 'salle' || c.type === 'capacite')
        ? sallesLibres(s, d.seances, d.salles, effectif).slice(0, 6)
        : [],
    [conflits, s, d.seances, d.salles, effectif],
  );

  const matieresConnues = useMemo(
    () => [...new Set(d.seances.map((x) => x.matiere))].sort((a, b) => a.localeCompare(b, 'fr')).slice(0, 12),
    [d.seances],
  );

  const sauvegarder = async () => {
    setEnCours(true);
    try {
      await d.enregistrerSeance(s);
      fermer();
    } catch (e) {
      Alert.alert('Enregistrement impossible', e instanceof Error ? e.message : String(e));
    } finally {
      setEnCours(false);
    }
  };

  const enregistrer = () => {
    const erreurs = validerSeance(s);
    if (erreurs.length) {
      Alert.alert('Saisie incomplète', erreurs.join('\n'));
      return;
    }
    if (bloquants.length) {
      Alert.alert(
        'Conflit d’horaire',
        `${bloquants.map((c) => '• ' + c.message).join('\n')}\n\nModifiez le créneau ou les ressources, ou enregistrez quand même (la séance sera signalée en conflit).`,
        [
          { text: 'Corriger', style: 'cancel' },
          { text: 'Enregistrer quand même', style: 'destructive', onPress: sauvegarder },
        ],
      );
      return;
    }
    sauvegarder();
  };

  const supprimer = () =>
    Alert.alert('Supprimer la séance', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await d.supprimerSeance(s.id!);
          fermer();
        },
      },
    ]);

  if (id !== 'nouvelle' && !existante) {
    return (
      <View style={{ padding: espace.l }}>
        <Text>Séance introuvable.</Text>
      </View>
    );
  }

  const manque = !d.salles.length || !d.enseignants.length || !d.groupes.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existante ? 'Modifier la séance' : 'Nouvelle séance' }} />
      <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
        {manque && (
          <View style={[st.panneau, st.alerte]}>
            <Text style={{ color: couleurs.alerte }}>
              Il faut au moins une salle, un enseignant et un groupe. Utilisez « Créer un nouvel élément » dans les listes ci-dessous.
            </Text>
          </View>
        )}

        <Champ label="Matière *" value={s.matiere} onChangeText={(t) => maj({ matiere: t })} placeholder="ex. Algorithmique" />
        {matieresConnues.length > 0 && !s.matiere && (
          <View style={{ marginTop: -espace.s, marginBottom: espace.m }}>
            <Puces options={matieresConnues.map((m) => ({ valeur: m, label: m }))} valeur={undefined} onChange={(m) => maj({ matiere: m })} />
          </View>
        )}

        <Label>Jour</Label>
        <View style={{ marginBottom: espace.m }}>
          <Puces options={JOURS.map((j) => ({ valeur: j.valeur, label: j.court }))} valeur={s.jour} onChange={(j) => maj({ jour: j as Jour })} />
        </View>

        <View style={{ flexDirection: 'row', gap: espace.m }}>
          <View style={{ flex: 1 }}>
          <ChampHeure
            label="Début"
            valeur={s.debut}
            onChange={(debut) => maj({ debut, fin: Math.min(HEURE_MAX + 60, debut + Math.max(s.fin - s.debut, 30)) })}
          />
          </View>
          <View style={{ flex: 1 }}>
            <ChampHeure label="Fin" valeur={s.fin} onChange={(fin) => maj({ fin })} />
          </View>
        </View>
        <View style={{ marginTop: -espace.s, marginBottom: espace.m }}>
          <Puces
            options={DUREES.map((m) => ({ valeur: m, label: m % 60 ? `${Math.floor(m / 60)}h30` : `${m / 60}h` }))}
            valeur={s.fin - s.debut}
            onChange={(m) => maj({ fin: s.debut + m })}
          />
        </View>

        <ChampListe label="Salle *" options={optSalles} valeur={s.salleId || undefined} onChange={(salleId) => maj({ salleId })} onCreer={() => router.push('/ressource/salle/nouvelle')} />
        <ChampListe label="Enseignant *" options={optEnseignants} valeur={s.enseignantId || undefined} onChange={(enseignantId) => maj({ enseignantId })} onCreer={() => router.push('/ressource/enseignant/nouvelle')} />
        <ChampListe label="Groupe *" options={optGroupes} valeur={s.groupeId || undefined} onChange={(groupeId) => maj({ groupeId })} onCreer={() => router.push('/ressource/groupe/nouvelle')} />

        {/* Résultat de la détection en direct */}
        {s.salleId > 0 && s.enseignantId > 0 && s.groupeId > 0 && s.fin > s.debut && (
          <View style={[st.panneau, bloquants.length ? st.ko : avertissements.length ? st.alerte : st.ok]}>
            {!conflits.length && (
              <View style={st.ligne}>
                <Ionicons name="checkmark-circle" size={20} color={couleurs.succes} />
                <Text style={{ color: couleurs.succes, fontWeight: '600', flex: 1 }}>
                  Créneau libre : aucun conflit ({formatHeure(s.debut)}–{formatHeure(s.fin)}).
                </Text>
              </View>
            )}
            {conflits.map((c, i) => (
              <View key={i} style={st.ligne}>
                <Ionicons name={c.bloquant ? 'close-circle' : 'alert-circle'} size={20} color={c.bloquant ? couleurs.danger : couleurs.alerte} />
                <Text style={{ color: c.bloquant ? couleurs.danger : couleurs.alerte, flex: 1 }}>{c.message}</Text>
              </View>
            ))}
            {suggestions.length > 0 && (
              <View style={{ marginTop: espace.s }}>
                <Text style={st.suggestion}>Salles libres sur ce créneau :</Text>
                <Puces options={suggestions.map((x) => ({ valeur: x.id, label: `${x.nom} (${x.capacite})` }))} valeur={undefined} onChange={(salleId) => maj({ salleId })} />
              </View>
            )}
          </View>
        )}

        <Champ label="Notes" value={s.notes} onChangeText={(t) => maj({ notes: t })} placeholder="Optionnel" multiline />

        <View style={{ gap: espace.m }}>
          <Bouton titre="Enregistrer" icone="save-outline" onPress={enregistrer} desactive={enCours} />
          {existante && <Bouton titre="Supprimer la séance" variante="danger" icone="trash-outline" onPress={supprimer} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  page: { padding: espace.l, paddingBottom: espace.xl * 2 },
  panneau: { borderRadius: 12, padding: espace.m, marginBottom: espace.m, borderWidth: 1, gap: espace.s },
  ok: { backgroundColor: couleurs.succesClair, borderColor: couleurs.succes },
  ko: { backgroundColor: couleurs.dangerClair, borderColor: couleurs.danger },
  alerte: { backgroundColor: couleurs.alerteClair, borderColor: couleurs.alerte },
  ligne: { flexDirection: 'row', gap: espace.s, alignItems: 'flex-start' },
  suggestion: { fontSize: 13, fontWeight: '600', color: couleurs.texte, marginBottom: espace.xs },
});
