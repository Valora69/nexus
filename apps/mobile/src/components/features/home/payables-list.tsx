import { View } from 'react-native';

import type { PayableItem } from '@repo/shared/types/entities';

import { GlassCard } from '../../ui';
import { EmptyRow, PartyRow, SectionHeader } from './parts';

export function PayablesList({ payables }: { payables: PayableItem[] }) {
  return (
    <GlassCard>
      <SectionHeader title="Payables" count={payables.length} />
      {payables.length === 0 ? (
        <EmptyRow message="No outstanding payables" />
      ) : (
        <View className="gap-3">
          {payables.map((p, i) => (
            <PartyRow
              key={`${p.to}-${p.group}-${i}`}
              primary={p.to}
              secondary={p.group}
              amount={p.amount}
              tone="loss"
              isLast={i === payables.length - 1}
            />
          ))}
        </View>
      )}
    </GlassCard>
  );
}
