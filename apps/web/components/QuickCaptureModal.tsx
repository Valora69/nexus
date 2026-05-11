'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Input } from '@web/components/ui/input';
import { Badge } from '@web/components/ui/badge';
import { useQuickCapture } from '@web/lib/client/mutations/personalTransactionMutation';

interface QuickCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLES = [
  { text: '50 grab "where or what"', label: 'expense', icon: ArrowDownRight },
  { text: '+50 gcash "name"', label: 'credit', icon: ArrowUpRight },
];

function parsePreview(
  input: string,
): { type: 'expense' | 'credit'; amount: string; rest: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const isCredit = trimmed.startsWith('+');
  const cleaned = trimmed.replace(/^\+/, '').replace(/^(PHP|php|\$|₱)\s*/i, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  const amount = tokens[0]?.replace(/[^0-9.]/g, '') ?? '';
  if (!amount || isNaN(Number(amount))) return null;

  return {
    type: isCredit ? 'credit' : 'expense',
    amount,
    rest: tokens.slice(1).join(' '),
  };
}

export function QuickCaptureModal({ open, onClose }: QuickCaptureModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useQuickCapture();

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      await mutation.mutateAsync({ input: trimmed });
      toast.success('Saved!', { duration: 1500 });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const preview = parsePreview(value);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Quick Add
            {/* <Badge variant="outline" className="text-xs font-mono ml-auto">
              B
            </Badge> */}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="50 grab chowking  or  +50 gcash james "
            className="text-base h-11 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none"
            disabled={mutation.isPending}
          />
        </div>

        {/* Live preview */}
        {preview && (
          <div className="px-4 pb-3 flex items-center gap-2">
            {preview.type === 'credit' ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />
            )}
            <span className="text-sm">
              <span
                className={`font-semibold ${preview.type === 'credit' ? 'text-green-500' : 'text-destructive'}`}
              >
                {preview.type === 'credit' ? '+' : '-'}₱{preview.amount}
              </span>
              {preview.rest && (
                <span className="text-muted-foreground ml-1">
                  {preview.rest}
                </span>
              )}
            </span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {preview.type}
            </Badge>
          </div>
        )}

        {/* Example hints */}
        {!value && (
          <div className="px-4 pb-4 flex gap-2 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.text}
                onClick={() => {
                  setValue(ex.text);
                  inputRef.current?.focus();
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded px-2 py-1 transition-colors"
              >
                <ex.icon className="h-3 w-3" />
                {ex.text}
              </button>
            ))}
          </div>
        )}

        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <span>Enter to save · Esc to close</span>
          {mutation.isPending && (
            <span className="text-primary">Saving...</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
