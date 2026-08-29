/**
 * Bottom tab bar for the authenticated app.
 *
 * IA note: expenses and payments are intentionally NOT top-level tabs —
 * on web they live inside Groups (for a shared expense) and Home (for a
 * personal transaction). Mobile matches that so the surface areas stay
 * comparable and the tab bar stays under five slots.
 *
 * Styling: pure-black bar to disappear into the app background, neon
 * accent for the active tab (matches web's active nav link), muted for
 * inactive. `@expo/vector-icons/Ionicons` was picked because Expo bundles
 * it — no extra native module to link.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName) {
  const Icon = ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
  Icon.displayName = `TabIcon(${String(name)})`;
  return Icon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_ACCENT_HEX,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: 'rgba(255,255,255,0.09)',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: 'Groups', tabBarIcon: tabIcon('people-outline') }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Friends', tabBarIcon: tabIcon('person-add-outline') }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: 'Activity', tabBarIcon: tabIcon('pulse-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tabs>
  );
}
