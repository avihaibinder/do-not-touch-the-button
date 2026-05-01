import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useResponsive from '../hooks/useResponsive';
import { colors } from '../theme/colors';

/**
 * AdMob banner placeholder.
 *
 * In Expo Go (no native AdMob module), we render a labelled placeholder.
 * In a dev/production build with `react-native-google-mobile-ads`, we render
 * a real BannerAd at the bottom.
 *
 * Replace TEST_BANNER_ID with your real AdMob unit IDs from app.json `extra`
 * before publishing.
 */

let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;
try {
  // eslint-disable-next-line global-require
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch (e) {
  // running without native module — placeholder only
}

const TEST_BANNER_ID = TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111';

export default function AdBanner({ position = 'bottom', adUnitId }) {
  const { ms, fs } = useResponsive();
  const unit = adUnitId || TEST_BANNER_ID;

  if (BannerAd) {
    return (
      <View style={[styles.wrap, position === 'top' ? styles.top : styles.bottom]}>
        <BannerAd
          unitId={unit}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    );
  }

  // Placeholder
  return (
    <View style={[styles.wrap, position === 'top' ? styles.top : styles.bottom]}>
      <View style={[styles.placeholder, { paddingVertical: ms(8) }]}>
        <Text style={[styles.text, { fontSize: fs(11) }]}>
          AD PLACEHOLDER · AdMob banner renders here in a native build
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
