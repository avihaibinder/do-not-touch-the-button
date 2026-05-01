import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useResponsive from '../hooks/useResponsive';
import { colors } from '../theme/colors';

/**
 * Ad banner placeholder.
 *
 * AdMob has been removed from this build. To re-enable ads, install
 * `react-native-google-mobile-ads`, add it back to app.json plugins,
 * and replace this component with a real BannerAd render.
 */
export default function AdBanner({ position = 'bottom' }) {
  const { ms, fs } = useResponsive();
  return (
    <View style={[styles.wrap, position === 'top' ? styles.top : styles.bottom]}>
      <View style={[styles.placeholder, { paddingVertical: ms(8) }]}>
        <Text style={[styles.text, { fontSize: fs(11) }]}>
          AD PLACEHOLDER
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  top:    { marginTop: 4 },
  bottom: { marginBottom: 0 },
  placeholder: {
    width: '92%',
    backgroundColor: 'rgba(26,26,46,0.08)',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,46,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.inkLight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
