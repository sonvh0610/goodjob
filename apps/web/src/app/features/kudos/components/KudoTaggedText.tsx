import { splitTaggedText } from '../tagging';

type KudoTaggedTextProps = {
  text: string;
  className?: string;
  tagClassName?: string;
  onTagClick?: (tag: string) => void;
};

export function KudoTaggedText({
  text,
  className,
  tagClassName,
  onTagClick,
}: KudoTaggedTextProps) {
  const segments = splitTaggedText(text);

  return (
    <p className={className}>
      {segments.map((segment, index) => {
        if (!segment.isTag || !segment.normalizedTag) {
          return <span key={`${index}-${segment.text}`}>{segment.text}</span>;
        }

        if (!onTagClick) {
          return (
            <span
              key={`${index}-${segment.text}`}
              className={tagClassName ?? 'font-semibold text-primary'}
            >
              {segment.text}
            </span>
          );
        }

        return (
          <button
            key={`${index}-${segment.text}`}
            className={
              tagClassName ??
              'cursor-pointer rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-container transition-colors hover:bg-primary/20'
            }
            onClick={() => onTagClick(segment.normalizedTag ?? '')}
            type="button"
          >
            {segment.text}
          </button>
        );
      })}
    </p>
  );
}
