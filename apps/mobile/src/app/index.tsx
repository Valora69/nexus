import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '../components/brand-logo';
import { colors, spacing } from '../lib/theme';
import { fontFamilies } from '../lib/theme/fonts';

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <BrandMark size={64} fontSize={40} />
        <Text style={styles.tag}>Split expenses. Track cash. Zero fees.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    paddingHorizontal: spacing[6],
  },
  tag: {
    color: colors.muted,
    fontFamily: fontFamilies.sans.light,
    fontSize: 16,
    textAlign: 'center',
  },
});
