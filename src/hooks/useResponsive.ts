import { useMemo } from 'react';
import { Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';

export type SizeBucket = 'small' | 'medium' | 'large' | 'tablet';

export interface Responsive {
  width: number;
  height: number;
  minDim: number;
  maxDim: number;
  size: SizeBucket;
  isTablet: boolean;
  isLandscape: boolean;
  scale: number;
  ms: (n: number) => number;
  fs: (n: number) => number;
  buttonBase: number;
  pixel: number;
  platform: typeof Platform.OS;
}

/**
 * Responsive sizing hook.
 * Breakpoints (logical px width):
 *   small  : <= 360
 *   medium : 361 - 414
 *   large  : 415 - 767  (large phones / phablets)
 *   tablet : >= 768
 */
export default function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  return useMemo<Responsive>(() => {
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    let size: SizeBucket;
    if (minDim <= 360) size = 'small';
    else if (minDim <= 414) size = 'medium';
    else if (minDim < 768) size = 'large';
    else size = 'tablet';

    const isTablet = size === 'tablet';
    const isLandscape = width > height;

    // Base scale anchored to a 390pt iPhone reference.
    const scale = Math.min(width, 1.0 * 390) / 390;
    const tabletBoost = isTablet ? 1.25 : 1;

    const ms = (n: number) => Math.round(n * scale * tabletBoost);
    const fs = (n: number) => Math.max(11, Math.round(n * scale * tabletBoost));

    const buttonBase = Math.round(
      Math.min(width, height) * (isTablet ? 0.32 : 0.45)
    );

    return {
      width,
      height,
      minDim,
      maxDim,
      size,
      isTablet,
      isLandscape,
      scale,
      ms,
      fs,
      buttonBase,
      pixel: 1 / PixelRatio.get(),
      platform: Platform.OS,
    };
  }, [width, height]);
}

export function staticDims(): { width: number; height: number } {
  const { width, height } = Dimensions.get('window');
  return { width, height };
}
