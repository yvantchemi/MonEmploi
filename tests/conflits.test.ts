import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detecterConflits,
  sallesLibres,
  tousLesConflits,
  validerSeance,
  type Index,
} from '../src/domain/conflits';
import { chevauche, formatHeure, parseHeure } from '../src/domain/temps';
import type { Salle, Seance } from '../src/domain/types';

const salles: Salle[] = [
  { id: 1, nom: 'A1', capacite: 30, type: 'Cours' },
  { id: 2, nom: 'B2', capacite: 60, type: 'Cours' },
  { id: 3, nom: 'Amphi', capacite: 200, type: 'Amphi' },
];
const index: Index = {
  salles: new Map(salles.map((s) => [s.id, s])),
  enseignants: new Map([
    [1, { id: 1, nom: 'Mbarga', prenom: 'Paul', email: '', specialite: '' }],
    [2, { id: 2, nom: 'Ngo', prenom: 'Alice', email: '', specialite: '' }],
  ]),
  groupes: new Map([
    [1, { id: 1, nom: 'G1', effectif: 25, niveau: 'L1' }],
    [2, { id: 2, nom: 'G2', effectif: 50, niveau: 'L1' }],
  ]),
};

const base: Seance = {
  id: 1, matiere: 'Maths', jour: 1, debut: 8 * 60, fin: 10 * 60,
  salleId: 1, enseignantId: 1, groupeId: 1, notes: '',
};

test('chevauchement : bornes adjacentes ne sont pas en conflit', () => {
  assert.equal(chevauche(480, 600, 600, 720), false);
  assert.equal(chevauche(480, 600, 599, 720), true);
  assert.equal(chevauche(480, 600, 500, 550), true);
});

test('formatage et lecture des heures', () => {
  assert.equal(formatHeure(485), '08:05');
  assert.equal(parseHeure('08:05'), 485);
  assert.equal(parseHeure('25:00'), null);
});

test('validation de saisie', () => {
  assert.ok(validerSeance({ ...base, matiere: ' ' }).length > 0);
  assert.ok(validerSeance({ ...base, fin: base.debut }).length > 0);
  assert.deepEqual(validerSeance(base), []);
});

test('conflit de salle, enseignant et groupe détectés', () => {
  const nouvelle = { ...base, id: undefined, matiere: 'Physique', debut: 9 * 60, fin: 11 * 60 };
  const types = detecterConflits(nouvelle, [base], index).map((c) => c.type).sort();
  assert.deepEqual(types, ['enseignant', 'groupe', 'salle']);
});

test('pas de conflit un autre jour ou sur un créneau adjacent', () => {
  assert.equal(detecterConflits({ ...base, id: undefined, jour: 2 }, [base], index).length, 0);
  assert.equal(detecterConflits({ ...base, id: undefined, debut: 600, fin: 720 }, [base], index).length, 0);
});

test('une séance modifiée ne se compare pas à elle-même', () => {
  assert.equal(detecterConflits({ ...base, fin: 11 * 60 }, [base], index).length, 0);
});

test('seul le groupe est en conflit si salle et enseignant diffèrent', () => {
  const c = detecterConflits({ ...base, id: undefined, salleId: 2, enseignantId: 2 }, [base], index);
  assert.deepEqual(c.map((x) => x.type), ['groupe']);
});

test('avertissement de capacité non bloquant', () => {
  const c = detecterConflits({ ...base, id: undefined, jour: 3, groupeId: 2 }, [base], index);
  assert.equal(c.length, 1);
  assert.equal(c[0].type, 'capacite');
  assert.equal(c[0].bloquant, false);
});

test('liste globale des conflits par balayage', () => {
  const seances: Seance[] = [
    base,
    { ...base, id: 2, salleId: 2, enseignantId: 2, groupeId: 2, debut: 9 * 60, fin: 12 * 60 }, // aucun commun
    { ...base, id: 3, salleId: 2, enseignantId: 2, groupeId: 2, debut: 11 * 60, fin: 13 * 60 }, // conflit avec 2
    { ...base, id: 4, debut: 10 * 60, fin: 11 * 60 }, // adjacent à 1 : pas de conflit avec 1
  ];
  const paires = tousLesConflits(seances);
  assert.equal(paires.length, 1);
  assert.deepEqual([paires[0].a.id, paires[0].b.id], [2, 3]);
  assert.deepEqual(paires[0].types, ['salle', 'enseignant', 'groupe']);
});

test('suggestion de salles libres assez grandes', () => {
  const libres = sallesLibres({ ...base, id: undefined }, [base], salles, 40);
  assert.deepEqual(libres.map((s) => s.nom), ['B2', 'Amphi']);
});

test('export CSV : en-tête, échappement et marquage des conflits', async () => {
  const { genererCsv } = await import('../src/export/formats');
  const s2: Seance = { ...base, id: 2, matiere: 'Algo; avancé', debut: 9 * 60 };
  const csv = genererCsv([s2, base], index, new Set([1, 2]));
  const lignes = csv.replace('﻿', '').split('\r\n');
  assert.equal(lignes[0], 'Jour;Début;Fin;Matière;Salle;Enseignant;Groupe;Conflit;Notes');
  assert.equal(lignes[1], 'Lundi;08:00;10:00;Maths;A1;Paul Mbarga;G1;OUI;');
  assert.ok(lignes[2].includes('"Algo; avancé"'));
});
