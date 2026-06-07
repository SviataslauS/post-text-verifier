import { GuidelineKind, GuidelineRule, type GuidelineConfig } from './types'

const MAX_POST_LENGTH = 500
const CAPS_RATIO_THRESHOLD = 0.7

export const guidelines = {
  [GuidelineRule.NoHateSpeech]: {
    kind: GuidelineKind.Pattern,
    pattern: /hate|violence/i,
    reason: 'Contains hate speech',
  },
  [GuidelineRule.MaxLength]: {
    kind: GuidelineKind.Length,
    maxChars: MAX_POST_LENGTH,
    reason: 'Exceeds character limit',
  },
  [GuidelineRule.NoAllCaps]: {
    kind: GuidelineKind.Caps,
    capsRatio: CAPS_RATIO_THRESHOLD,
    reason: 'Excessive capitalisation',
  },
} satisfies GuidelineConfig
