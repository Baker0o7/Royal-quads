import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.royalquads.app',
  appName: 'Royal Quad Bikes',
  webDir:  'dist',
  server: {
    // Allow navigation to Google OAuth / GSI domains so the sign-in
    // iframe and redirect flows work inside the Android WebView.
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'oauth2.googleapis.com',
    ],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
