import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExportBoutons } from '../../components/ExportBouton';
import { SeanceCarte } from '../../components/SeanceCarte';
import { Bouton, Carte, EtatVide, Titre, type NomIcone } from '../../components/ui';
import { jourCourant, nomJour } from '../../domain/temps';
import { useDonnees } from '../../state/DataContext';
import { couleurs, espace } from '../../theme/theme';

function Stat({ icone, valeur, label, onPress }: { icone: NomIcone; valeur: number; label: string; onPress: () => void }) {
  return (
    <Pressable style={st.stat} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${valeur} ${label}`}>
      <Ionicons name={icone} size={22} color={couleurs.primaire} />
      <Text style={st.statValeur}>{valeur}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Accueil() {
  const d = useDonnees();
  const jour = jourCourant();
  const aujourdhui = d.seances.filter((s) => s.jour === jour);
  const vide = !d.salles.length && !d.enseignants.length && !d.groupes.length;

  const reinitialiser = () =>
    Alert.alert('Réinitialiser', 'Supprimer toutes les salles, enseignants, groupes et séances ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout supprimer', style: 'destructive', onPress: d.reinitialiser },
    ]);

  return (
    <ScrollView contentContainerStyle={st.page}>
      <View style={st.stats}>
        <Stat icone="business-outline" valeur={d.salles.length} label="Salles" onPress={() => router.navigate({ pathname: '/ressources', params: { onglet: 'salle' } })} />
        <Stat icone="person-outline" valeur={d.enseignants.length} label="Enseignants" onPress={() => router.navigate({ pathname: '/ressources', params: { onglet: 'enseignant' } })} />
        <Stat icone="people-outline" valeur={d.groupes.length} label="Groupes" onPress={() => router.navigate({ pathname: '/ressources', params: { onglet: 'groupe' } })} />
        <Stat icone="time-outline" valeur={d.seances.length} label="Séances" onPress={() => router.navigate('/seances')} />
      </View>

      <Pressable onPress={() => router.push('/conflits')} accessibilityRole="button">
        <Carte style={[st.etat, d.conflits.length ? st.etatKo : st.etatOk]}>
          <Ionicons
            name={d.conflits.length ? 'warning' : 'checkmark-circle'}
            size={28}
            color={d.conflits.length ? couleurs.danger : couleurs.succes}
          />
          <View style={{ flex: 1 }}>
            <Text style={[st.etatTitre, { color: d.conflits.length ? couleurs.danger : couleurs.succes }]}>
              {d.conflits.length ? `${d.conflits.length} conflit(s) d'horaire` : 'Aucun conflit'}
            </Text>
            <Text style={st.etatTexte}>
              {d.conflits.length ? 'Touchez pour voir et corriger.' : "L'emploi du temps est cohérent."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={couleurs.texteDoux} />
        </Carte>
      </Pressable>

      {vide ? (
        <Carte>
          <EtatVide icone="school-outline" texte="Commencez par créer vos salles, enseignants et groupes, ou chargez un jeu d'exemple.">
            <Bouton titre="Charger des données d'exemple" icone="download-outline" onPress={d.chargerDemo} />
            <Bouton titre="Ajouter une ressource" variante="secondaire" icone="add" onPress={() => router.navigate('/ressources')} />
          </EtatVide>
        </Carte>
      ) : (
        <Bouton titre="Nouvelle séance" icone="add-circle-outline" onPress={() => router.push('/seance/nouvelle')} />
      )}

      <View>
        <Titre>{`Aujourd'hui · ${nomJour(jour)}`}</Titre>
        {aujourdhui.length ? (
          <View style={{ gap: espace.s }}>
            {aujourdhui.map((s) => (
              <SeanceCarte key={s.id} seance={s} index={d.index} enConflit={d.idsConflit.has(s.id)} onPress={() => router.push(`/seance/${s.id}`)} />
            ))}
          </View>
        ) : (
          <Text style={st.doux}>Aucune séance prévue.</Text>
        )}
      </View>

      <Carte>
        <Titre>{"Exporter tout l'emploi du temps"}</Titre>
        <ExportBoutons titre="Emploi du temps complet" seances={d.seances} />
      </Carte>

      {!vide && <Bouton titre="Réinitialiser les données" variante="danger" icone="trash-outline" onPress={reinitialiser} />}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: espace.l, gap: espace.l, paddingBottom: espace.xl * 2 },
  stats: { flexDirection: 'row', gap: espace.s },
  stat: {
    flex: 1,
    backgroundColor: couleurs.carte,
    borderRadius: 12,
    paddingVertical: espace.m,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: couleurs.bordure,
  },
  statValeur: { fontSize: 22, fontWeight: '800', color: couleurs.texte, marginTop: 2 },
  statLabel: { fontSize: 11, color: couleurs.texteDoux },
  etat: { flexDirection: 'row', alignItems: 'center', gap: espace.m },
  etatOk: { backgroundColor: couleurs.succesClair, borderColor: couleurs.succes },
  etatKo: { backgroundColor: couleurs.dangerClair, borderColor: couleurs.danger },
  etatTitre: { fontSize: 16, fontWeight: '700' },
  etatTexte: { fontSize: 13, color: couleurs.texte },
  doux: { color: couleurs.texteDoux },
});
