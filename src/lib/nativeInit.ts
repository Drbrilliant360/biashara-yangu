import { Capacitor } from '@capacitor/core';

/**
 * One-time setup when running inside the Capacitor Android/iOS shell.
 * No-op in the browser. Plugins are imported lazily so the web bundle stays small.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('native-app', `platform-${Capacitor.getPlatform()}`);

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    }
  } catch (e) {
    console.warn('StatusBar unavailable', e);
  }

  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    // Keep focused inputs visible above the on-screen keyboard.
    Keyboard.setScroll({ isDisabled: false }).catch(() => undefined);
  } catch (e) {
    console.warn('Keyboard unavailable', e);
  }

  try {
    const { App } = await import('@capacitor/app');
    // Android hardware back button: navigate back, exit only from the root screen.
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    console.warn('App plugin unavailable', e);
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen unavailable', e);
  }
}
