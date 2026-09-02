/**
 * Bottom-anchored modal used for forms and confirmations.
 *
 * React Native's native `Modal` gives us the overlay + dismiss handling
 * for free; we skin it with a translucent scrim, a rounded top-only
 * card, and a drag handle to hint the sheet metaphor. There is no
 * gesture-to-dismiss yet — tap the scrim or the Close affordance.
 *
 * The sheet uses `KeyboardAvoidingView` so a keyboard opening from an
 * inline `<TextField>` never covers the primary action; safe-area
 * padding is applied at the bottom so the content clears the home
 * indicator on notched iPhones.
 */

import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Footer row anchored below the scrollable content (e.g. action buttons). */
  footer?: ReactNode;
}>;

export function ModalSheet({
  visible,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/70 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          className="flex-1"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView
            edges={['bottom', 'left', 'right']}
            className="bg-background rounded-t-3xl border-t border-border-strong"
          >
            <View className="items-center pt-3 pb-1">
              <View className="h-1.5 w-10 rounded-full bg-border-strong" />
            </View>
            {title ? (
              <View className="px-6 pt-3 pb-2 gap-1">
                <Text className="text-foreground font-sans-bold text-xl">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="text-muted font-sans text-sm">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <View className="px-6 pt-2 pb-4">{children}</View>
            {footer ? <View className="px-6 pt-2 pb-2">{footer}</View> : null}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
