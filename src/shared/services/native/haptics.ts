import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { isNative } from './appLifecycle';

/** A light tap on native devices; no-op on the web. */
const lightImpact = () => {
  if (!isNative()) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
};

export { lightImpact };
