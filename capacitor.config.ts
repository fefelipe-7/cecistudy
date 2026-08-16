import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ceci.study.app',
  appName: 'cecistudy',
  webDir: 'dist',
  backgroundColor: '#FFFCF8',
  android: {
    backgroundColor: '#FFFCF8',
  },
  ios: {
    backgroundColor: '#FFFCF8',
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    // OTA self-hosted: atualizações web via @capgo/capacitor-updater (modo manual,
    // dirigido pelo JS em src/lib/ota.ts — endpoint estático no GitHub Pages).
    CapacitorUpdater: {
      autoUpdate: 'off',
    },
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#FFFCF8',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFCF8',
      overlaysWebView: false,
    },
  },
};

export default config;