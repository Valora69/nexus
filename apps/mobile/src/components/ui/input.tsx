import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { Text } from './text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: Props) {
  return (
    <View className="gap-1.5">
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#8a8a94"
        className={cn(
          'rounded-xl border border-border bg-surface px-4 py-3 text-base text-white',
          error && 'border-[#ff6b6b]',
          className,
        )}
        {...props}
      />
      {error ? <Text className="text-xs text-[#ff6b6b]">{error}</Text> : null}
    </View>
  );
}
