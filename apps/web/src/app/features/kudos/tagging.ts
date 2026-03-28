const RECENT_TAGS_STORAGE_KEY = 'goodjob.kudos.recentTags';
const TAG_REGEX = /(^|\s)(#[A-Za-z0-9_-]{1,30})/g;
const TAG_TOKEN_REGEX = /^[A-Za-z0-9_-]+$/;
const MAX_RECENT_TAGS = 20;

export type TaggedTextSegment = {
  text: string;
  isTag: boolean;
  normalizedTag?: string;
};

export function normalizeTag(tag: string) {
  return tag.replace(/^#/, '').trim().toLowerCase();
}

export function extractUniqueTags(text: string) {
  const unique = new Map<string, string>();

  for (const match of text.matchAll(TAG_REGEX)) {
    const rawTag = match[2];
    if (!rawTag) continue;
    const normalized = normalizeTag(rawTag);
    if (!normalized || unique.has(normalized)) continue;
    unique.set(normalized, rawTag.slice(1));
  }

  return Array.from(unique.values());
}

export function splitTaggedText(text: string): TaggedTextSegment[] {
  const segments: TaggedTextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(TAG_REGEX)) {
    const fullMatch = match[0];
    const tag = match[2];
    const index = match.index ?? 0;
    if (!tag) continue;

    const leadingWhitespace = fullMatch.slice(0, fullMatch.length - tag.length);
    const textEnd = index + leadingWhitespace.length;

    if (textEnd > cursor) {
      segments.push({
        text: text.slice(cursor, textEnd),
        isTag: false,
      });
    }

    segments.push({
      text: tag,
      isTag: true,
      normalizedTag: normalizeTag(tag),
    });
    cursor = textEnd + tag.length;
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isTag: false,
    });
  }

  return segments.length > 0 ? segments : [{ text, isTag: false }];
}

export function readRecentTags() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TAGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((tag) => tag.trim())
      .filter((tag) => TAG_TOKEN_REGEX.test(tag))
      .slice(0, MAX_RECENT_TAGS);
  } catch {
    return [];
  }
}

export function mergeRecentTags(existing: string[], incoming: string[]) {
  const merged = [...incoming, ...existing];
  const unique = new Map<string, string>();

  for (const tag of merged) {
    const clean = tag.trim().replace(/^#/, '');
    if (!TAG_TOKEN_REGEX.test(clean)) continue;
    const normalized = clean.toLowerCase();
    if (unique.has(normalized)) continue;
    unique.set(normalized, clean);
    if (unique.size >= MAX_RECENT_TAGS) break;
  }

  return Array.from(unique.values());
}

export function saveRecentTags(tags: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RECENT_TAGS_STORAGE_KEY, JSON.stringify(tags));
}

export function findTagQueryAtCaret(text: string, caret: number) {
  const boundedCaret = Math.max(0, Math.min(caret, text.length));
  const textBeforeCaret = text.slice(0, boundedCaret);
  const hashIndex = textBeforeCaret.lastIndexOf('#');
  if (hashIndex < 0) return null;

  const charBefore = hashIndex > 0 ? text[hashIndex - 1] : ' ';
  if (!/\s/.test(charBefore)) return null;

  const query = text.slice(hashIndex + 1, boundedCaret);
  if (!TAG_TOKEN_REGEX.test(query) && query.length > 0) return null;

  return {
    query: query.toLowerCase(),
    start: hashIndex,
  };
}

export function replaceTagAtCaret(text: string, caret: number, tag: string) {
  const query = findTagQueryAtCaret(text, caret);
  if (!query) return null;

  const sanitized = tag.trim().replace(/^#/, '');
  if (!TAG_TOKEN_REGEX.test(sanitized)) return null;

  let end = caret;
  while (end < text.length && TAG_TOKEN_REGEX.test(text[end] ?? '')) {
    end += 1;
  }

  const tagText = `#${sanitized}`;
  const suffix = text[end] === ' ' || end === text.length ? '' : ' ';
  const nextValue = `${text.slice(0, query.start)}${tagText}${suffix}${text.slice(
    end
  )}`;
  const nextCaret = query.start + tagText.length + suffix.length;

  return { nextValue, nextCaret };
}
