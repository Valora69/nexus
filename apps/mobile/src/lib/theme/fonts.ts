/**
 * Google Fonts loader for Inter (UI) and JetBrains Mono (numerals).
 * The family names registered here (e.g. `Inter_400Regular`) are what
 * `tailwind.config.js` maps `font-sans` / `font-sans-bold` / etc. to,
 * so components reference weights via NativeWind classes only.
 */

import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

export function useAppFonts() {
  const [loaded, error] = useInterFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });
  return { loaded, error };
}
