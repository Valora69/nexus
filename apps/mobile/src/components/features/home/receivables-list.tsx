import { View } from 'react-native';

import type { ReceivableItem } from '@repo/shared/types/entities';

import { GlassCard } from '../../ui';
import { EmptyRow, PartyRow, SectionHeader } from './parts';

export function ReceivablesList({ receivables }: { receivables: ReceivableItem[] }) {
  return (
    <GlassCard>
      <SectionHeader title="Receivables" count={receivables.length} />
      {receivables.length === 0 ? (
        <EmptyRow message="No outstanding receivables" />
      ) : (
        <View className="gap-3">
          {receivables.map((r, i) => (
            <PartyRow
              key={`${r.from}-${r.group}-${i}`}
              primary={r.from}
              secondary={r.group}
              amount={r.amount}
              tone="gain"
              isLast={i === receivables.length - 1}
            />
          ))}
        </View>
      )}
    </GlassCard>
  );
}
