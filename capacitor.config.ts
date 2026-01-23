/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.fitmeal.app',
  appName: 'FitMeal',
  webDir: 'dist',
  server: {
    // Para desenvolvimento, você pode usar um servidor local
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true
    },
    App: {
      // Configuração para deep links
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#ffffffff'
    },
    EdgeToEdge: {
      backgroundColor: '#ffffff'
    }
  },
  android: {
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ],
    allowMixedContent: true
  }
};

export default config;