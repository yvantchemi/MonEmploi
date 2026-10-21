/** Vue de l'emploi du temps filtrée par enseignant, groupe ou salle. */
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExportBoutons } from '../../components/ExportBouton';
import { SeanceCarte } from '../../components/SeanceCarte';
import { ChampListe, type OptionListe } from '../../components/Selecteurs';
import { Carte, EtatVide, Puces } from '../../components/ui';
import { nomEnseignant } from '../../domain/conflits';
import { formatHeure, jourCourant, JOURS } from '../../domain/temps';
import type { Seance, TypeRessource } from '../../domain/types';
import { useDonnees } from '../../state/DataContext';
import { couleurs, espace } from '../../theme/theme';

const champ: Record<TypeRessource, keyof Seance> = { enseignant: 'enseignantId', groupe: 'groupeId', salle: 'salleId' };
const SEMAINE = 0;

export default function Planning() {
  const d = useDonnees();
  const [mode, setMode] = useState<TypeRessource>('enseignant');
  const [selection, setSelection] = useState<Partial<Record<TypeRessource, number>>>({});
  const [jour, setJour] = useState<number>(SEMAINE);

  const options: OptionListe[] = useMemo(() => {
    if (mode === 'enseignant')
      return d.enseignants.map((e) => ({ id: e.id, titre: nomEnseignant(e), sousTitre: e.specialite }));
    if (mode === 'groupe')
      return d.groupes.map((g) => ({ id: g.id, titre: g.nom, sousTitre: `${g.niveau} · ${g.effectif} élèves` }));
    return d.salles.map((s) => ({ id: s.id, titre: s.nom, sousTitre: `${s.type} · ${s.capacite} places` }));
  }, [mode, d.enseignants, d.groupes, d.salles]);

  // Sélection par défaut : premier élément de la liste.
  const idChoisi = options.some((o) => o.id === selection[mode]) ? selection[mode] : options[0]?.id;
  const titreChoisi = options.find((o) => o.id === idChoisi)?.titre ?? '';

  const seancesCible = useMemo(
    () => d.seances.filter((s) => s[champ[mode]] === idChoisi),
    [d.seances, mode, idChoisi],
  );
  const visibles = jour === SEMAINE ? seancesCible : seancesCible.filter((s) => s.jour === jour);
  const minutes = seancesCible.reduce((t, s) => t + (s.fin - s.debut), 0);

  const libelle = { enseignant: 'Enseignant', groupe: 'Groupe', salle: 'Salle' }[mode];

  return (
    <ScrollView contentContainerStyle={st.page}>
      <Puces
        defilement={false}
        options={[
          { valeur: 'enseignant', label: 'Par enseignant' },
          { valeur: 'groupe', label: 'Par groupe' },
          { valeur: 'salle', label: 'Par salle' },
        ]}
        valeur={mode}
        onChange={(m) => setMode(m as TypeRessource)}
      />

      {!options.length ? (
        <EtatVide icone="calendar-outline" texte={`Aucun(e) ${libelle.toLowerCase()} enregistré(e). Ajoutez-en dans l'onglet Ressources.`} />
      ) : (
        <>
          <View>
            <ChampListe
              label={libelle}
              options={options}
              valeur={idChoisi}
              onChange={(id) => setSelection((s) => ({ ...s, [mode]: id }))}
            />
          </View>

          <Carte style={st.resume}>
            <Text style={st.resumeTexte}>
              <Text style={st.gras}>{seancesCible.length}</Text> séance(s) ·{' '}
              <Text style={st.gras}>{formatHeure(minutes).replace(':', 'h')}</Text> par semaine
            </Text>
          </Carte>

          <View>
            <Puces
              options={[{ valeur: SEMAINE, label: 'Semaine' }, ...JOURS.map((j) => ({ valeur: j.valeur as number, label: j.court }))]}
              valeur={jour}
              onChange={setJour}
            />
          </View>

          {jour === SEMAINE ? (
            JOURS.map((j) => {
              const duJour = visibles.filter((s) => s.jour === j.valeur);
              return (
                <View key={j.valeur} style={{ gap: espace.s }}>
                  <Text style={[st.jour, j.valeur === jourCourant() && { color: couleurs.primaire }]}>{j.nom}</Text>
                  {duJour.length ? (
                    duJour.map((s) => (
                      <SeanceCarte key={s.id} seance={s} index={d.index} masquer={mode} enConflit={d.idsConflit.has(s.id)} onPress={() => router.push(`/seance/${s.id}`)} />
                    ))
                  ) : (
                    <Text style={st.libre}>Libre</Text>
                  )}
                </View>
              );
            })
          ) : visibles.length ? (
            <View style={{ gap: espace.s }}>
              {visibles.map((s) => (
                <SeanceCarte key={s.id} seance={s} index={d.index} masquer={mode} enConflit={d.idsConflit.has(s.id)} onPress={() => router.push(`/seance/${s.id}`)} />
              ))}
            </View>
          ) : (
            <EtatVide icone="sunny-outline" texte="Journée libre." />
          )}

          <Carte>
            <Text style={[st.gras, { marginBottom: espace.s }]}>Exporter ce planning</Text>
            <ExportBoutons titre={`Emploi du temps - ${titreChoisi}`} seances={seancesCible} />
          </Carte>
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: espace.l, gap: espace.m, paddingBottom: espace.xl * 2 },
  resume: { paddingVertical: espace.m },
  resumeTexte: { color: couleurs.texte, fontSize: 14 },
  gras: { fontWeight: '700', color: couleurs.texte },
  jour: { fontSize: 15, fontWeight: '700', color: couleurs.texte, marginTop: espace.s },
  libre: { color: couleurs.texteDoux, fontStyle: 'italic', marginLeft: espace.s },
});
