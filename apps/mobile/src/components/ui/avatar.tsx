/**
 * Circular avatar. If `uri` is supplied it renders the image; otherwise
 * we fall back to a colored circle with the user's initial, which is
 * how web handles a missing `picture`.
 */

import { useState } from 'react';
import { Image, Text, View } from 'react-native';

type Size = 24 | 32 | 40 | 48 | 64;

const textSize: Record<Size, string> = {
  24: 'text-xs',
  32: 'text-sm',
  40: 'text-base',
  48: 'text-lg',
  64: 'text-2xl',
};

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: Size;
  className?: string;
};

function initialOf(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return '?';
  return trimmed[0]!.toUpperCase();
}

export function Avatar({ uri, name, size = 40, className }: Props) {
  const [errored, setErrored] = useState(false);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        onError={() => setErrored(true)}
        style={dimension}
        className={className}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      style={dimension}
      className={`items-center justify-center bg-card-strong border border-border ${className ?? ''}`}
    >
      <Text className={`font-sans-semibold text-foreground ${textSize[size]}`}>
        {initialOf(name)}
      </Text>
    </View>
  );
}
