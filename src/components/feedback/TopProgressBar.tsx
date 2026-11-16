import React, { useEffect, useState } from 'react';
import { subscribeNetworkActivity } from '@/lib/networkActivity';

/**
 * Thin progress bar fixed at the top of the screen. Shows whenever the app is
 * talking to the backend (data loads, saves, deletes, uploads).
 */
export const TopProgressBar: React.FC = () => {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeNetworkActivity((n) => setActive(n > 0)), []);

  // Small delay avoids flicker on very fast requests; linger briefly after finishing.
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setVisible(true), 150);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-1 w-full bg-primary/15">
        <div className="top-progress-bar h-1 w-1/3 rounded-full bg-primary" />
      </div>
    </div>
  );
};
