import { router } from 'expo-router';

/** Ferme l'écran courant ; revient à l'accueil s'il n'y a pas d'historique (lien direct). */
export function fermer(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
