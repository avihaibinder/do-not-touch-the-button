import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import LevelScreen from './LevelScreen';
import HamburgerMenu from '../components/HamburgerMenu';
import { colors, gradients } from '../theme/colors';
import { useGame } from '../context/GameContext';

/**
 * Top-level routing container after the loading screen.
 *
 * The entire game flow (level play, success modal, failure modal) lives inside
 * LevelScreen. This wrapper just owns the global hamburger menu state.
 */
export default function GameContainer() {
  const { hydrated } = useGame();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      {hydrated && (
        <LevelScreen onOpenMenu={() => setMenuOpen(true)} />
      )}
      <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgTop },
});
