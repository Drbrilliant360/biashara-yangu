import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tz.co.biasharayangu.app',
  appName: 'Biashara Yangu',
  webDir: 'www',
  backgroundColor: '#FFFFFF',
  ios: {
    contentInset: 'never', // safe areas are handled in CSS (env(safe-area-inset-*))
    limitsNavigationsToAppBoundDomains: false,
    scheme: 'Biashara Yangu',
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
