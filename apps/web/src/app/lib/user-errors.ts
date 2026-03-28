export type UserErrorContext =
  | 'generic'
  | 'auth-oauth'
  | 'kudos-form-load'
  | 'kudos-submit'
  | 'feed-load'
  | 'comment-submit'
  | 'rewards-load'
  | 'reward-redeem'
  | 'notifications-load'
  | 'wallet-load'
  | 'dashboard-load';

interface ErrorRule {
  includes: string[];
  message: string;
}

const GENERIC_RULES: ErrorRule[] = [
  {
    includes: ['request failed (401)'],
    message: 'Your session has expired. Please sign in again.',
  },
  {
    includes: ['unauthorized'],
    message: 'Your session has expired. Please sign in again.',
  },
  {
    includes: ['request failed (403)'],
    message: 'You do not have permission to do this action.',
  },
  {
    includes: ['request failed (404)'],
    message: 'The requested information could not be found.',
  },
  {
    includes: ['request failed (500)'],
    message: 'Something went wrong on our side. Please try again in a moment.',
  },
];

const CONTEXT_RULES: Record<UserErrorContext, ErrorRule[]> = {
  generic: [],
  'auth-oauth': [
    {
      includes: ['google oauth is not configured'],
      message: 'Google sign-in is not available right now.',
    },
    {
      includes: ['slack oauth is not configured'],
      message: 'Slack sign-in is not available right now.',
    },
    {
      includes: ['unsupported provider'],
      message: 'That sign-in provider is not supported.',
    },
  ],
  'kudos-form-load': [
    {
      includes: ['cannot load send-kudos form data'],
      message: 'Unable to load form data. Please refresh the page and try again.',
    },
  ],
  'kudos-submit': [
    {
      includes: ['cannot send kudo to self'],
      message: 'You cannot send a kudo to yourself.',
    },
    {
      includes: ['receiver not found'],
      message: 'Please choose a valid teammate to receive your kudo.',
    },
    {
      includes: ['at least one core tag is required'],
      message: 'Please select at least one core value tag.',
    },
    {
      includes: ['monthly budget exceeded'],
      message: 'You do not have enough monthly points left to send this kudo.',
    },
    {
      includes: ['invalid media asset'],
      message: 'The selected media could not be used. Please upload again.',
    },
    {
      includes: ['image file size must be <= 1mb'],
      message: 'Image is too large. Please choose an image up to 1MB.',
    },
    {
      includes: ['video file appears too large'],
      message: 'Video is too large. Please choose a smaller file.',
    },
    {
      includes: ['video duration must be 3 minutes or less'],
      message: 'Video must be 3 minutes or less.',
    },
    {
      includes: ['description: too small'],
      message: 'Please write at least 5 characters in your kudos message.',
    },
    {
      includes: ['coretagids:'],
      message: 'Please select at least one core value tag.',
    },
  ],
  'feed-load': [],
  'comment-submit': [
    {
      includes: ['invalid media asset'],
      message: 'The selected media could not be used. Please upload again.',
    },
    {
      includes: ['image file size must be <= 1mb'],
      message: 'Image is too large. Please choose an image up to 1MB.',
    },
    {
      includes: ['video file appears too large'],
      message: 'Video is too large. Please choose a smaller file.',
    },
    {
      includes: ['video duration must be 3 minutes or less'],
      message: 'Video must be 3 minutes or less.',
    },
  ],
  'rewards-load': [],
  'reward-redeem': [
    {
      includes: ['insufficient points'],
      message: 'You do not have enough points to redeem this reward.',
    },
    {
      includes: ['reward out of stock'],
      message: 'This reward is out of stock right now.',
    },
    {
      includes: ['reward not available'],
      message: 'This reward is currently unavailable.',
    },
  ],
  'notifications-load': [],
  'wallet-load': [],
  'dashboard-load': [],
};

function rawMessageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '';
}

function findRuleMessage(message: string, rules: ErrorRule[]): string | null {
  const normalized = message.toLowerCase();
  for (const rule of rules) {
    if (rule.includes.every((part) => normalized.includes(part))) {
      return rule.message;
    }
  }
  return null;
}

export function getUserFacingError(
  error: unknown,
  options: { fallback: string; context?: UserErrorContext }
): string {
  const { fallback, context = 'generic' } = options;
  const rawMessage = rawMessageFromError(error).trim();

  if (!rawMessage) {
    return fallback;
  }

  const contextMessage = findRuleMessage(rawMessage, CONTEXT_RULES[context] ?? []);
  if (contextMessage) {
    return contextMessage;
  }

  const genericMessage = findRuleMessage(rawMessage, GENERIC_RULES);
  if (genericMessage) {
    return genericMessage;
  }

  return fallback;
}
