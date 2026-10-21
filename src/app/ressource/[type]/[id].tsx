/** Création / modification / suppression d'une salle, d'un enseignant ou d'un groupe. */
import { Stack, useLocalSearchParams } from 'expo-router';
import { fermer } from '../../../navigation';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Bouton, Champ } from '../../../components/ui';
import type { TypeRessource } from '../../../domain/types';
import { compterUtilisations, useDonnees } from '../../../state/DataContext';
import { espace } from '../../../theme/theme';

const LIBELLES: Record<TypeRessource, string> = { salle: 'salle', enseignant: 'enseignant', groupe: 'groupe' };

function messageErreur(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return /UNIQUE/i.test(m) ? 'Un élément portant ce nom existe déjà.' : m;
}

export default function EditionRessource() {
  const { type, id } = useLocalSearchParams<{ type: TypeRessource; id: string }>();
  const d = useDonnees();
  const numId = id === 'nouvelle' ? undefined : Number(id);

  const salle = type === 'salle' ? d.salles.find((x) => x.id === numId) : undefined;
  const ens = type === 'enseignant' ? d.enseignants.find((x) => x.id === numId) : undefined;
  const grp = type === 'groupe' ? d.groupes.find((x) => x.id === numId) : undefined;

  // Champs génériques : a = nom, b = prénom/type/niveau, c = capacité/effectif/spécialité, e = email
  const [a, setA] = useState(salle?.nom ?? ens?.nom ?? grp?.nom ?? '');
  const [b, setB] = useState(salle?.type ?? ens?.prenom ?? grp?.niveau ?? '');
  const [c, setC] = useState(
    salle ? String(salle.capacite) : grp ? String(grp.effectif) : (ens?.specialite ?? ''),
  );
  const [email, setEmail] = useState(ens?.email ?? '');
  const [enCours, setEnCours] = useState(false);

  const nombre = (t: string) => Math.max(0, parseInt(t, 10) || 0);

  const enregistrer = async () => {
    if (!a.trim()) {
      Alert.alert('Champ manquant', 'Le nom est obligatoire.');
      return;
    }
    if (type === 'enseignant' && email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Email invalide', "Vérifiez l'adresse email.");
      return;
    }
    setEnCours(true);
    try {
      if (type === 'salle') await d.enregistrerSalle({ id: numId, nom: a.trim(), type: b.trim(), capacite: nombre(c) });
      else if (type === 'groupe') await d.enregistrerGroupe({ id: numId, nom: a.trim(), niveau: b.trim(), effectif: nombre(c) });
      else await d.enregistrerEnseignant({ id: numId, nom: a.trim(), prenom: b.trim(), specialite: c.trim(), email: email.trim() });
      fermer();
    } catch (e) {
      Alert.alert('Enregistrement impossible', messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = () => {
    if (!numId) return;
    const n = compterUtilisations(d.seances, type, numId);
    Alert.alert(
      'Supprimer',
      n ? `Cette ressource est utilisée par ${n} séance(s), qui seront aussi supprimées. Continuer ?` : 'Supprimer définitivement cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await d.supprimerRessource(type, numId);
            fermer();
          },
        },
      ],
    );
  };

  const titre = `${numId ? 'Modifier' : 'Nouveau·elle'} ${LIBELLES[type]}`;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: titre }} />
      <ScrollView contentContainerStyle={{ padding: espace.l }} keyboardShouldPersistTaps="handled">
        {type === 'salle' && (
          <>
            <Champ label="Nom de la salle *" value={a} onChangeText={setA} placeholder="ex. Salle 101" />
            <Champ label="Type" value={b} onChangeText={setB} placeholder="Cours, TP, Amphi…" />
            <Champ label="Capacité (places)" value={c} onChangeText={setC} keyboardType="number-pad" placeholder="40" />
          </>
        )}
        {type === 'enseignant' && (
          <>
            <Champ label="Nom *" value={a} onChangeText={setA} placeholder="ex. Mbarga" />
            <Champ label="Prénom" value={b} onChangeText={setB} placeholder="ex. Paul" />
            <Champ label="Spécialité" value={c} onChangeText={setC} placeholder="ex. Mathématiques" />
            <Champ label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="nom@ecole.cm" />
          </>
        )}
        {type === 'groupe' && (
          <>
            <Champ label="Nom du groupe *" value={a} onChangeText={setA} placeholder="ex. L1 Info A" />
            <Champ label="Niveau" value={b} onChangeText={setB} placeholder="ex. Licence 1" />
            <Champ label="Effectif (élèves)" value={c} onChangeText={setC} keyboardType="number-pad" placeholder="35" />
          </>
        )}
        <View style={{ gap: espace.m, marginTop: espace.s }}>
          <Bouton titre="Enregistrer" icone="save-outline" onPress={enregistrer} desactive={enCours} />
          {!!numId && <Bouton titre="Supprimer" variante="danger" icone="trash-outline" onPress={supprimer} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
