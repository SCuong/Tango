import { describe, it, expect } from 'vitest';
import { isFirstVisitAsset } from '../offlineAssets';

describe('first-visit offline assets', () => {
  it('hands the built bundles, fonts, icons, and the brand wordmark to the service worker', () => {
    for (const url of [
      'https://tango.test/assets/index-B-Z93wEV.js',
      'https://tango.test/assets/index-CZgDG1Fm.css',
      'https://tango.test/assets/tango-wordmark-CElsICMq.webp',
      'https://tango.test/icon.png',
      'https://tango.test/icon.svg',
      'https://tango.test/manifest.webmanifest',
      'https://fonts.gstatic.com/s/bevietnampro/v1/font.woff2',
      'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro',
      'https://tango.test/assets/index.js?v=2',
    ]) {
      expect(isFirstVisitAsset(url), url).toBe(true);
    }
  });

  it('ignores navigations and other requests', () => {
    for (const url of ['https://tango.test/', 'https://tango.test/settings', 'https://tango.test/api/data.json']) {
      expect(isFirstVisitAsset(url), url).toBe(false);
    }
  });
});
