import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.royalquads.app',
  appName: 'Royal Quads',
  webDir:  'dist',
  plugins: {
    GoogleAuth: {
      scopes:               ['profile', 'email'],
      // Web OAuth Client ID (same as server client ID for SPA)
      serverClientId:       '979880974098-uvtfo8sokk6bemv38h9dm89gfl84raj7.apps.googleusercontent.com',
      // Android requires its own OAuth client entry in Google Cloud Console
      // with the SHA-1 fingerprint of the signing certificate
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
