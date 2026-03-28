const DEFAULT_REACTION_EMOJIS = ['👏', '🔥', '🙌', '🎉'];

type ReactionToggleGroupProps = {
  reactions: { emoji: string; count: number }[];
  userReactions: string[];
  onToggle: (emoji: string) => void;
};

export function ReactionToggleGroup({
  reactions,
  userReactions,
  onToggle,
}: ReactionToggleGroupProps) {
  const reactionCountMap = new Map(
    reactions.map((reaction) => [reaction.emoji, reaction.count])
  );
  const reactionEmojis = Array.from(
    new Set([...DEFAULT_REACTION_EMOJIS, ...reactions.map((r) => r.emoji)])
  );

  return (
    <>
      {reactionEmojis.map((emoji) => {
        const active = userReactions.includes(emoji);
        const count = reactionCountMap.get(emoji) ?? 0;
        return (
          <button
            key={emoji}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              active
                ? 'bg-primary text-on-primary'
                : 'border border-secondary-fixed/40 bg-secondary text-on-secondary hover:bg-secondary-fixed'
            }`}
            onClick={() => onToggle(emoji)}
            type="button"
          >
            {emoji} {count}
          </button>
        );
      })}
    </>
  );
}
