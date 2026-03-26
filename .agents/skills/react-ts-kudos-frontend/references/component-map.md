# Component Map

## Suggested Routes
- `/feed`: live kudos feed.
- `/kudos/new`: give kudo form.
- `/rewards`: reward catalog and redemption history.

## Suggested Modules
- `features/kudos`: form, mutations, validators.
- `features/feed`: list, card, reactions, comments.
- `features/rewards`: catalog, redeem mutation, status chips.
- `shared/api`: typed API client.
- `shared/ui`: buttons, modals, toasts, skeletons.

## Key UX Contracts
- Every write action shows pending, success, and error state.
- Infinite scroll or load-more must preserve scroll position.
- Media preview should appear before submit.
