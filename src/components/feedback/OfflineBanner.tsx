import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Tells the user when the device has no connection, instead of silent failures. */
export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-[90] flex items-center justify-center gap-2 bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You are offline. Changes cannot be saved until you reconnect.
    </div>
  );
};
