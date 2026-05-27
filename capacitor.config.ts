import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arrowpuzzle.game',
  appName: 'Arrow Puzzle',
  webDir: 'out',
  server: {
    // For development: point to your local dev server
    // url: 'http://localhost:3000',
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#4A90D9',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF',
  },
};

export default config;
