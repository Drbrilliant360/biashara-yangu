import { Capacitor } from '@capacitor/core';

/**
 * Platform helpers.
 *
 * - `isNative`   : running inside the Capacitor Android/iOS shell
 * - `isIOSApp`   : running inside the iOS shell (App Store build)
 *
 * Apple App Store Guideline 3.1.1 forbids unlocking app features through
 * payment mechanisms other than In-App Purchase, and 3.1.3 forbids calls to
 * action that steer users to external payment. The iOS build therefore never
 * renders any payment UI (see `canPayInApp`).
 */
export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getPlatform = (): 'web' | 'ios' | 'android' => {
  try {
    const p = Capacitor.getPlatform();
    return p === 'ios' || p === 'android' ? p : 'web';
  } catch {
    return 'web';
  }
};

export const isIOSApp = (): boolean => getPlatform() === 'ios';

/** Mobile-money subscription payment is allowed everywhere except the iOS app. */
export const canPayInApp = (): boolean => !isIOSApp();
