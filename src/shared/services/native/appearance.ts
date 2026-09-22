import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { isNative } from './appLifecycle';

/** Status bar + splash screen setup after first render; no-op on the web. */
const initAppearance = async () => {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#fdf1f0' });
  } catch {
    // Status bar API is unavailable on some devices; ignore.
  }
  await SplashScreen.hide();
};

export { initAppearance };
