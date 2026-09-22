import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type Unsubscribe = () => void;

const isNative = () => Capacitor.isNativePlatform();

/** Android hardware back button. Returns an unsubscribe function. */
const registerBackButton = (handler: () => void): Unsubscribe => {
  if (!isNative()) return () => {};
  const pending = App.addListener('backButton', handler);
  return () => {
    void pending.then((listener) => listener.remove());
  };
};

/** Fires when the app returns to the foreground. */
const onAppResume = (handler: () => void): Unsubscribe => {
  if (!isNative()) return () => {};
  const pending = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) handler();
  });
  return () => {
    void pending.then((listener) => listener.remove());
  };
};

const exitApp = () => {
  if (isNative()) void App.exitApp();
};

export { exitApp, isNative, onAppResume, registerBackButton };
