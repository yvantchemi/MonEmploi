import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initialiserBase, NOM_BASE } from '../db/schema';
import { DataProvider } from '../state/DataContext';
import { couleurs } from '../theme/theme';

function Chargement() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond }}>
      <ActivityIndicator size="large" color={couleurs.primaire} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Suspense fallback={<Chargement />}>
        <SQLiteProvider databaseName={NOM_BASE} onInit={initialiserBase} useSuspense>
          <DataProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: couleurs.primaire },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: couleurs.fond },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="seance/[id]" options={{ title: 'Séance', presentation: 'modal' }} />
              <Stack.Screen name="ressource/[type]/[id]" options={{ title: 'Ressource', presentation: 'modal' }} />
              <Stack.Screen name="conflits" options={{ title: 'Conflits détectés' }} />
            </Stack>
          </DataProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}

// Un lien direct vers un écran modal garde les onglets en dessous (retour possible).
export const unstable_settings = { initialRouteName: '(tabs)' };
