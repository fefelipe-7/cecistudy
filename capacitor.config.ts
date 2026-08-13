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
  },
  plugins: {
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