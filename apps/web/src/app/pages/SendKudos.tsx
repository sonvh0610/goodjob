import { useRef } from 'react';
import { KudosMediaDropzone } from '../components/media/KudosMediaDropzone';
import { KudoTaggedText } from '../features/kudos/components/KudoTaggedText';
import { useKudoTagSuggestions } from '../features/kudos/hooks/useKudoTagSuggestions';
import { useSendKudosForm } from '../features/kudos/hooks/useSendKudosForm';

const CORE_VALUES = [
  'Teamwork',
  'Ownership',
  'Craft Excellence',
  'Customer Focus',
  'Growth Mindset',
];

export default function SendKudos() {
  const {
    users,
    receiverId,
    setReceiverId,
    receiver,
    points,
    setSafePoints,
    coreValue,
    setCoreValue,
    description,
    setDescription,
    taggedUserIds,
    setTaggedUserIds,
    mediaFiles,
    setMediaFiles,
    loading,
    error,
    setError,
    onSubmit,
  } = useSendKudosForm();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    suggestions,
    selectedIndex,
    showSuggestions,
    onTextareaChange,
    onTextareaSelectionChange,
    onTextareaKeyDown,
    onTextareaBlur,
    applySuggestion,
  } = useKudoTagSuggestions({
    value: description,
    onChange: setDescription,
    textareaRef,
  });

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 md:py-8 bg-surface-container-low">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
            Send Kudos
          </h1>
          <p className="mt-2 text-on-surface-variant text-base">
            Give 10-50 points and optionally attach media.
          </p>
        </header>

        <form
          className="rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-[0_12px_40px_rgba(55,39,77,0.06)] space-y-6"
          onSubmit={onSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Receiver
              </span>
              <select
                className="w-full rounded-xl border border-surface-container bg-white px-3 py-3 text-on-surface"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              >
                <option value="">Select a teammate</option>
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName} ({item.email})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Selected Receiver
              </p>
              <p className="mt-2 text-lg font-bold text-on-surface">
                {receiver ? receiver.displayName : 'No receiver selected'}
              </p>
              <p className="text-sm text-on-surface-variant">
                {receiver?.email ?? '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Points
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  className="w-28 rounded-xl border border-surface-container bg-white px-3 py-2 text-base font-bold text-on-surface"
                  min={10}
                  max={50}
                  step={5}
                  type="number"
                  value={points}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSafePoints(value);
                  }}
                />
                <span className="text-sm font-semibold text-primary">
                  10-50 per kudo
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                Monthly giving wallet is capped at 200 points and resets every
                UTC month.
              </p>
            </div>

            <label className="space-y-2 rounded-2xl bg-surface-container-low p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Core Value
              </span>
              <select
                className="w-full rounded-xl border border-surface-container bg-white px-3 py-3 text-on-surface"
                value={coreValue}
                onChange={(event) => setCoreValue(event.target.value)}
                required
              >
                {CORE_VALUES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Tagged Teammates
            </span>
            <select
              className="min-h-32 w-full rounded-xl border border-surface-container bg-white px-3 py-3 text-on-surface"
              multiple
              value={taggedUserIds}
              onChange={(event) => {
                const values = Array.from(
                  event.target.selectedOptions,
                  (option) => option.value
                );
                setTaggedUserIds(values);
              }}
            >
              {users
                .filter((item) => item.id !== receiverId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName} ({item.email})
                  </option>
                ))}
            </select>
            <p className="text-xs text-on-surface-variant">
              Hold command/control to select multiple teammates for real-time
              notifications.
            </p>
          </label>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Kudos Message
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-on-surface"
                rows={5}
                value={description}
                placeholder="What did they do great? Try tags like #Teamwork"
                onChange={(event) =>
                  onTextareaChange(
                    event.target.value,
                    event.target.selectionStart ?? event.target.value.length
                  )
                }
                onClick={(event) =>
                  onTextareaSelectionChange(
                    event.currentTarget.selectionStart ?? 0
                  )
                }
                onKeyUp={(event) =>
                  onTextareaSelectionChange(
                    event.currentTarget.selectionStart ?? 0
                  )
                }
                onSelect={(event) =>
                  onTextareaSelectionChange(
                    event.currentTarget.selectionStart ?? 0
                  )
                }
                onKeyDown={onTextareaKeyDown}
                onBlur={onTextareaBlur}
                required
              />
              {showSuggestions ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-surface-container bg-white p-2 shadow-lg">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Recent tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((tag, index) => (
                      <button
                        key={tag}
                        type="button"
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          selectedIndex === index
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-surface-container bg-surface-container-low text-on-surface hover:bg-surface-container'
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applySuggestion(tag);
                        }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Preview
              </p>
              <KudoTaggedText
                text={
                  description || 'Your kudos message preview will appear here.'
                }
                className="mt-2 whitespace-pre-wrap text-sm text-on-surface"
                tagClassName="rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-container"
              />
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Media (optional)
            </span>
            <KudosMediaDropzone
              files={mediaFiles}
              onFilesChange={setMediaFiles}
              maxFiles={5}
              onError={(message) => {
                if (message) {
                  setError(message);
                }
              }}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              className="cursor-pointer rounded-full bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Kudo'}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
