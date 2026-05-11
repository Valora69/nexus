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
    <div className="mb-10 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Notes</h2>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={editedNotes}
              onChange={(e) => onEditedNotesChange(e.target.value)}
              className={`min-h-[160px] text-gray-700 leading-relaxed ${
                notesError ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              placeholder="Add any details about this expense..."
              aria-invalid={!!notesError}
              aria-describedby={notesError ? 'notes-error' : undefined}
            />
            <div className="flex items-center justify-between">
              {notesError ? (
                <p
                  id="notes-error"
                  className="text-sm text-red-600 font-medium"
                >
                  {notesError}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Notes are optional but helpful for context.
                </p>
              )}
              <p
                className={`text-sm ${
                  editedNotes.length > 2000
                    ? 'text-red-600 font-medium'
                    : editedNotes.length > 0 && editedNotes.length < 5
                      ? 'text-orange-600'
                      : 'text-gray-500'
                }`}
              >
                {editedNotes.length} / 2000 characters
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      ) : (
        <p
          className="text-gray-700 leading-relaxed text-justify cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
          onDoubleClick={onStartEdit}
          title="Double click to edit notes"
        >
          {notes
            ? truncateText(notes, 600)
            : 'No notes added yet. Double click here to add some details.'}
          {notes && notes.length > 600 && (
            <span className="ml-1 font-semibold text-gray-900">…</span>
          )}
        </p>
      )}
    </div>
  );
}
