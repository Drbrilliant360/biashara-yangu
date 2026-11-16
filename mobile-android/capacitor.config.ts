import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tz.co.biasharayangu.app',
  appName: 'Biashara Yangu',
  webDir: 'www',
  backgroundColor: '#FFFFFF',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false, // hidden by src/lib/nativeInit.ts once the app has booted
      backgroundColor: '#FFFFFF',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
