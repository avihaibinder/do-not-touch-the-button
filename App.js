import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { GameProvider } from './src/context/GameContext';
import LoadingScreen from './src/screens/LoadingScreen';
import GameContainer from './src/screens/GameContainer';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // Allow native splash to clear once JS is ready, our LoadingScreen takes over.
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setBooted(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="dark" />
          {booted ? <GameContainer /> : <LoadingScreen />}
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
