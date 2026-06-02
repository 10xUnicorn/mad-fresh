/**
 * @type {import('@capacitor/cli').CapacitorConfig}
 *
 * Physical food ordering app — exempt from Apple IAP rule 3.1.1.
 * Stripe handles all payments for physical goods (meals, catering).
 */
const config = {
  appId: 'app.madfresh.kitchen',
  appName: 'Mad Fresh Kitchen',
  webDir: 'out',
  server: {
    url: 'https://madfresh.app',
    cleartext: false,
  },
  ios: {
    scheme: 'Mad Fresh Kitchen',
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#faf8f3',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#faf8f3',
      showSpinner: false,
      launchAutoHide: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#faf8f3',
    },
  },
};

module.exports = config;
