/**
 * État global de l'application.
 * Toutes les données sont chargées UNE fois depuis SQLite au démarrage ; chaque
 * modification exécute une seule écriture puis met à jour l'état en mémoire
 * (pas de rechargement complet). Les vues et la détection de conflits lisent
 * uniquement cet état.
 */
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as repo from '../db/repository';
import { idsEnConflit, tousLesConflits, type Index, type PaireEnConflit } from '../domain/conflits';
import type { Enseignant, Groupe, Salle, Seance, SeanceBrouillon, TypeRessource } from '../domain/types';

interface ContexteDonnees extends repo.Donnees {
  pret: boolean;
  index: Index;
  conflits: PaireEnConflit[];
  idsConflit: Set<number>;
  enregistrerSalle: (s: Omit<Salle, 'id'> & { id?: number }) => Promise<Salle>;
  enregistrerEnseignant: (e: Omit<Enseignant, 'id'> & { id?: number }) => Promise<Enseignant>;
  enregistrerGroupe: (g: Omit<Groupe, 'id'> & { id?: number }) => Promise<Groupe>;
  supprimerRessource: (type: TypeRessource, id: number) => Promise<void>;
  enregistrerSeance: (s: SeanceBrouillon) => Promise<Seance>;
  supprimerSeance: (id: number) => Promise<void>;
  chargerDemo: () => Promise<void>;
  reinitialiser: () => Promise<void>;
}

const Contexte = createContext<ContexteDonnees | null>(null);

const VIDE: repo.Donnees = { salles: [], enseignants: [], groupes: [], seances: [] };

/** Remplace (ou ajoute) un élément par son id, puis trie. */
function remplacer<T extends { id: number }>(liste: T[], el: T, tri: (a: T, b: T) => number): T[] {
  const sans = liste.filter((x) => x.id !== el.id);
  return [...sans, el].sort(tri);
}
const parNom = (a: { nom: string }, b: { nom: string }) => a.nom.localeCompare(b.nom, 'fr');
const parCreneau = (a: Seance, b: Seance) => a.jour - b.jour || a.debut - b.debut;

const champSeance: Record<TypeRessource, keyof Seance> = {
  salle: 'salleId',
  enseignant: 'enseignantId',
  groupe: 'groupeId',
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [donnees, setDonnees] = useState<repo.Donnees>(VIDE);
  const [pret, setPret] = useState(false);

  const recharger = useCallback(async () => {
    setDonnees(await repo.chargerTout(db));
    setPret(true);
  }, [db]);

  // Chargement initial unique.
  useEffect(() => {
    let actif = true;
    repo.chargerTout(db).then((d) => {
      if (!actif) return;
      setDonnees(d);
      setPret(true);
    });
    return () => {
      actif = false;
    };
  }, [db]);

  const index = useMemo<Index>(
    () => ({
      salles: new Map(donnees.salles.map((s) => [s.id, s])),
      enseignants: new Map(donnees.enseignants.map((e) => [e.id, e])),
      groupes: new Map(donnees.groupes.map((g) => [g.id, g])),
    }),
    [donnees.salles, donnees.enseignants, donnees.groupes],
  );

  const conflits = useMemo(() => tousLesConflits(donnees.seances), [donnees.seances]);
  const idsConflit = useMemo(() => idsEnConflit(conflits), [conflits]);

  const valeur = useMemo<ContexteDonnees>(
    () => ({
      ...donnees,
      pret,
      index,
      conflits,
      idsConflit,
      enregistrerSalle: async (s) => {
        const r = await repo.enregistrerSalle(db, s);
        setDonnees((d) => ({ ...d, salles: remplacer(d.salles, r, parNom) }));
        return r;
      },
      enregistrerEnseignant: async (e) => {
        const r = await repo.enregistrerEnseignant(db, e);
        setDonnees((d) => ({ ...d, enseignants: remplacer(d.enseignants, r, parNom) }));
        return r;
      },
      enregistrerGroupe: async (g) => {
        const r = await repo.enregistrerGroupe(db, g);
        setDonnees((d) => ({ ...d, groupes: remplacer(d.groupes, r, parNom) }));
        return r;
      },
      supprimerRessource: async (type, id) => {
        await repo.supprimerRessource(db, type, id);
        const cle = (type + 's') as 'salles' | 'enseignants' | 'groupes';
        setDonnees((d) => ({
          ...d,
          [cle]: (d[cle] as { id: number }[]).filter((x) => x.id !== id),
          // reflète le ON DELETE CASCADE de la base
          seances: d.seances.filter((s) => s[champSeance[type]] !== id),
        }));
      },
      enregistrerSeance: async (s) => {
        const r = await repo.enregistrerSeance(db, s);
        setDonnees((d) => ({ ...d, seances: remplacer(d.seances, r, parCreneau) }));
        return r;
      },
      supprimerSeance: async (id) => {
        await repo.supprimerSeance(db, id);
        setDonnees((d) => ({ ...d, seances: d.seances.filter((s) => s.id !== id) }));
      },
      chargerDemo: async () => {
        await repo.insererDemo(db);
        await recharger();
      },
      reinitialiser: async () => {
        await repo.viderBase(db);
        setDonnees(VIDE);
      },
    }),
    [db, donnees, pret, index, conflits, idsConflit, recharger],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDonnees(): ContexteDonnees {
  const c = useContext(Contexte);
  if (!c) throw new Error('useDonnees doit être utilisé dans <DataProvider>');
  return c;
}

/** Nombre de séances utilisant une ressource (affiché avant suppression). */
export function compterUtilisations(seances: Seance[], type: TypeRessource, id: number): number {
  const champ = champSeance[type];
  return seances.filter((s) => s[champ] === id).length;
}
