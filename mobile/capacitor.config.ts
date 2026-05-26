import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.netwebmedia.app',
  appName: 'NetWebMedia',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#010F3B',
      showSpinner: false,
      androidSplashResourceName: 'splash'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
