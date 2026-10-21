import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useDonnees } from '../../state/DataContext';
import { couleurs } from '../../theme/theme';

type NomIcone = React.ComponentProps<typeof Ionicons>['name'];
function icone(nom: NomIcone) {
  const IconeOnglet = ({ color, size }: { color: ColorValue | null; size: number }) => (
    <Ionicons name={nom} color={color as string} size={size} />
  );
  IconeOnglet.displayName = `Icone(${nom})`;
  return IconeOnglet;
}

export default function TabsLayout() {
  const { conflits } = useDonnees();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: couleurs.primaire },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: couleurs.primaire,
        tabBarInactiveTintColor: couleurs.texteDoux,
        sceneStyle: { backgroundColor: couleurs.fond },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerTitle: 'MonEmploi',
          tabBarIcon: icone('home-outline'),
          tabBarBadge: conflits.length || undefined,
        }}
      />
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: icone('calendar-outline') }} />
      <Tabs.Screen name="seances" options={{ title: 'Séances', tabBarIcon: icone('list-outline') }} />
      <Tabs.Screen name="ressources" options={{ title: 'Ressources', tabBarIcon: icone('albums-outline') }} />
    </Tabs>
  );
}
