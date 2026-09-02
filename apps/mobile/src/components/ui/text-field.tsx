/**
 * Labeled single-line text input matching the glass surface theme.
 *
 * A stateless field — controlled by the caller via `value` / `onChangeText`
 * — keeps the primitive dumb. `error` renders an inline loss-tone hint
 * below the input; useful for surfacing server validation without a
 * full toast/modal.
 *
 * Multiline is opt-in via `multiline`. The height auto-grows on iOS via
 * `textAlignVertical="top"` + a min-height class the caller can override.
 */

import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../../lib/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  helper?: string;
  containerClassName?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  {
    label,
    error,
    helper,
    containerClassName,
    className,
    multiline,
    style,
    ...rest
  },
  ref,
) {
  return (
    <View className={`gap-1.5 ${containerClassName ?? ''}`}>
      {label ? (
        <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`bg-card border rounded-xl px-4 py-3 text-foreground font-sans text-base ${
          error ? 'border-loss' : 'border-border-strong'
        } ${multiline ? 'min-h-24' : ''} ${typeof className === 'string' ? className : ''}`}
        style={style}
        {...rest}
      />
      {error ? (
        <Text className="text-loss font-sans text-xs">{error}</Text>
      ) : helper ? (
        <Text className="text-muted font-sans text-xs">{helper}</Text>
      ) : null}
    </View>
  );
});
