import { KeyboardEvent, RefObject, useEffect, useMemo, useState } from 'react';
import {
  findTagQueryAtCaret,
  readRecentTags,
  replaceTagAtCaret,
} from '../tagging';

type UseKudoTagSuggestionsInput = {
  value: string;
  onChange: (nextValue: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function useKudoTagSuggestions({
  value,
  onChange,
  textareaRef,
}: UseKudoTagSuggestionsInput) {
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [caret, setCaret] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setRecentTags(readRecentTags());
  }, []);

  const tagQuery = useMemo(
    () => findTagQueryAtCaret(value, caret),
    [caret, value]
  );

  const suggestions = useMemo(() => {
    if (!tagQuery) return [];
    if (!tagQuery.query) return recentTags;
    return recentTags.filter((tag) =>
      tag.toLowerCase().startsWith(tagQuery.query)
    );
  }, [recentTags, tagQuery]);

  useEffect(() => {
    setSelectedIndex(0);
    setDismissed(false);
  }, [tagQuery?.query, tagQuery?.start]);

  const onTextareaChange = (nextValue: string, nextCaret: number) => {
    onChange(nextValue);
    setCaret(nextCaret);
    setDismissed(false);
  };

  const onTextareaSelectionChange = (nextCaret: number) => {
    setCaret(nextCaret);
  };

  const applySuggestion = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const replacement = replaceTagAtCaret(value, textarea.selectionStart, tag);
    if (!replacement) return;

    onChange(replacement.nextValue);
    setCaret(replacement.nextCaret);
    setDismissed(false);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(replacement.nextCaret, replacement.nextCaret);
    });
  };

  const onTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === 'Enter' && tagQuery) {
      event.preventDefault();
      applySuggestion(suggestions[selectedIndex] ?? suggestions[0]);
      return;
    }

    if (event.key === 'Escape') {
      setDismissed(true);
    }
  };

  return {
    suggestions,
    selectedIndex,
    showSuggestions: Boolean(tagQuery) && suggestions.length > 0 && !dismissed,
    onTextareaChange,
    onTextareaSelectionChange,
    onTextareaKeyDown,
    applySuggestion,
  };
}
