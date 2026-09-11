'use client';

import { Button } from '@web/components/ui/button';
import { Textarea } from '@web/components/ui/textarea';
import { truncateText } from '@web/lib/utils';

interface ExpenseNotesSectionProps {
  notes: string | undefined;
  isEditing: boolean;
  editedNotes: string;
  notesError: string | null;
  isPending: boolean;
  onEditedNotesChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ExpenseNotesSection({
  notes,
  isEditing,
  editedNotes,
  notesError,
  isPending,
  onEditedNotesChange,
  onStartEdit,
  onSave,
  onCancel,
}: ExpenseNotesSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">Notes</h2>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={editedNotes}
              onChange={(e) => onEditedNotesChange(e.target.value)}
              className={`min-h-[160px] leading-relaxed ${
                notesError ? 'border-loss focus-visible:ring-loss' : ''
              }`}
              placeholder="Add any details about this expense..."
              aria-invalid={!!notesError}
              aria-describedby={notesError ? 'notes-error' : undefined}
            />
            <div className="flex items-center justify-between">
              {notesError ? (
                <p id="notes-error" className="text-sm font-medium text-loss">
                  {notesError}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Notes are optional but helpful for context.
                </p>
              )}
              <p
                className={`text-sm ${
                  editedNotes.length > 2000
                    ? 'font-medium text-loss'
                    : editedNotes.length > 0 && editedNotes.length < 5
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-muted'
                }`}
              >
                {editedNotes.length} / 2000 characters
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      ) : (
        <p
          className="cursor-pointer rounded-2xl border border-border bg-card p-4 leading-relaxed text-foreground transition-colors hover:bg-card-hover"
          onDoubleClick={onStartEdit}
          title="Double click to edit notes"
        >
          {notes
            ? truncateText(notes, 600)
            : 'No notes added yet. Double click here to add some details.'}
          {notes && notes.length > 600 && (
            <span className="ml-1 font-semibold text-foreground">…</span>
          )}
        </p>
      )}
    </div>
  );
}
