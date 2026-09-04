import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { formatDate } from '@repo/shared/utils/formatters';

import { GlassCard, TextField } from '../../ui';

export function ExpenseFormFields({
  name,
  amount,
  notes,
  date,
  onNameChange,
  onAmountChange,
  onNotesChange,
  onDateChange,
}: {
  name: string;
  amount: string;
  notes: string;
  date: Date;
  onNameChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onDateChange: (d: Date) => void;
}) {
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handlePickerChange = (
    _event: DateTimePickerEvent,
    picked: Date | undefined,
  ) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (picked) onDateChange(picked);
  };

  return (
    <GlassCard>
      <View className="gap-4">
        <TextField
          label="Name"
          placeholder="e.g. Lunch, Ferry ride"
          value={name}
          onChangeText={onNameChange}
          autoCapitalize="sentences"
          maxLength={100}
        />
        <TextField
          label="Total amount (₱)"
          placeholder="0.00"
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
        />
        <View className="gap-1.5">
          <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
            Date
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPicker(true)}
            className="bg-card border border-border-strong rounded-xl px-4 py-3"
          >
            <Text className="text-foreground font-sans text-base">
              {formatDate(date)}
            </Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          ) : null}
        </View>
        <TextField
          label="Notes (optional)"
          placeholder="Anything worth remembering"
          value={notes}
          onChangeText={onNotesChange}
          multiline
          maxLength={2000}
        />
      </View>
    </GlassCard>
  );
}
