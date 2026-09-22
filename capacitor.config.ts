import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dava.todo',
  appName: 'Todo Dava',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#fdf1f0',
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
