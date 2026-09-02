import type { ExpoConfig } from 'expo/config';

// Google's native iOS SDK returns to the app via a URL scheme derived from
// the iOS OAuth client ID (the "reversed client ID"). Missing this scheme
// is the classic silent-failure mode: the system browser opens, the user
// picks an account, and the redirect back into the app never fires — the
// auth session resolves as `dismiss` and the login button just resets.
//
// We compute the scheme from `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` so it can
// never drift from the client ID actually used at runtime. Update the env
// var, rebuild the dev client, and both halves move together.
function reversedIosClientScheme(): string | null {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!clientId) return null;
  const suffix = '.apps.googleusercontent.com';
  const base = clientId.endsWith(suffix)
    ? clientId.slice(0, -suffix.length)
    : clientId;
  return `com.googleusercontent.apps.${base}`;
}

const googleScheme = reversedIosClientScheme();

const config: ExpoConfig = {
  name: 'Money App',
  slug: 'moneyapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'moneyapp',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'click.moneyapp.mobile',
    infoPlist: {
      CFBundleURLTypes: googleScheme
        ? [{ CFBundleURLSchemes: [googleScheme] }]
        : [],
    },
  },
  android: {
    package: 'click.moneyapp.mobile',
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#000000',
        image: './assets/images/splash-icon.png',
        imageWidth: 96,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
