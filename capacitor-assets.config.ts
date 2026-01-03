import { defineConfig } from '@capacitor/assets';

const config = defineConfig({
  iconBackgroundColor: '#ffffff',
  iconBackgroundColorDark: '#000000',
  splashBackgroundColor: '#ffffff',
  splashBackgroundColorDark: '#000000',
  android: {
    icon: {
      source: './assets/icon.jpg',
      target: './android/app/src/main/res',
    },
    splash: {
      source: './assets/splash.jpg',
      target: './android/app/src/main/res',
    },
  },
});

export default config;

