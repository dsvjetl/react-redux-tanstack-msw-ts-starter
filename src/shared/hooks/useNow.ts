import { useEffect, useState } from 'react';

import { onAppResume } from '../services/native/appLifecycle';

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * The current time, refreshed on an interval, when the tab becomes visible,
 * and when the native app resumes. Drives "Up next" and the midnight rollover.
 */
const useNow = (intervalMs: number = DEFAULT_INTERVAL_MS): Date => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = window.setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const unsubscribeResume = onAppResume(tick);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      unsubscribeResume();
    };
  }, [intervalMs]);

  return now;
};

export { useNow };
