import {
  GuidelineKind,
  GuidelineRule,
  InputErrorKind,
  type InputError,
  type PostInput,
  type Result,
  type VerifiedPost,
  type VerificationResult,
  VerificationStatus,
  type Violation,
} from './types'
import { guidelines } from './guidelines'

const EXCERPT_CONTEXT_CHARS = 20
const ASCII_UPPERCASE_START = 'A'.charCodeAt(0)
const ASCII_UPPERCASE_END = 'Z'.charCodeAt(0)
const ASCII_LOWERCASE_START = 'a'.charCodeAt(0)
const ASCII_LOWERCASE_END = 'z'.charCodeAt(0)

const GUIDELINE_RULES = Object.values(GuidelineRule)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateInput(raw: unknown): Result<PostInput, InputError> {
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: { kind: InputErrorKind.InvalidType, received: typeof raw },
    }
  }

  if (!('content' in raw)) {
    return {
      ok: false,
      error: { kind: InputErrorKind.MissingField, field: 'content' },
    }
  }

  if (typeof raw.content !== 'string') {
    return {
      ok: false,
      error: { kind: InputErrorKind.InvalidType, received: typeof raw.content },
    }
  }

  let authorId: string | undefined
  if ('authorId' in raw) {
    if (typeof raw.authorId !== 'string') {
      return {
        ok: false,
        error: {
          kind: InputErrorKind.InvalidType,
          received: typeof raw.authorId,
        },
      }
    }
    authorId = raw.authorId
  }

  if (raw.content.length === 0) {
    return { ok: false, error: { kind: InputErrorKind.EmptyContent } }
  }
  if (raw.content.trim().length === 0) {
    return { ok: false, error: { kind: InputErrorKind.WhitespaceOnlyContent } }
  }

  return {
    ok: true,
    value:
      authorId !== undefined
        ? { content: raw.content, authorId }
        : { content: raw.content },
  }
}

function extractExcerpt(post: string, match: RegExpMatchArray): string {
  const matchIndex = match.index ?? 0
  const start = Math.max(0, matchIndex - EXCERPT_CONTEXT_CHARS)
  const end = Math.min(
    post.length,
    matchIndex + match[0].length + EXCERPT_CONTEXT_CHARS,
  )
  return post.slice(start, end)
}

function buildViolation(rule: GuidelineRule, excerpt: string): Violation {
  return {
    rule,
    reason: guidelines[rule].reason,
    excerpt,
  }
}

function countAlphabeticChars(content: string): {
  uppercase: number
  total: number
} {
  let uppercase = 0
  let total = 0
  for (const char of content) {
    const code = char.charCodeAt(0)
    const isUpper =
      code >= ASCII_UPPERCASE_START && code <= ASCII_UPPERCASE_END
    const isLower =
      code >= ASCII_LOWERCASE_START && code <= ASCII_LOWERCASE_END
    if (!isUpper && !isLower) continue
    total++
    if (isUpper) uppercase++
  }
  return { uppercase, total }
}

function validateRule(rule: GuidelineRule, content: string): Violation | null {
  const guideline = guidelines[rule]
  switch (guideline.kind) {
    case GuidelineKind.Pattern: {
      const match = content.match(guideline.pattern)
      if (!match) return null
      return buildViolation(rule, extractExcerpt(content, match))
    }
    case GuidelineKind.Length: {
      if (content.length <= guideline.maxChars) return null
      const excerpt = content.slice(0, EXCERPT_CONTEXT_CHARS) + '...'
      return buildViolation(rule, excerpt)
    }
    case GuidelineKind.Caps: {
      const { uppercase, total } = countAlphabeticChars(content)
      if (total === 0) return null
      const ratio = uppercase / total
      if (ratio <= guideline.capsRatio) return null
      return buildViolation(rule, content.slice(0, EXCERPT_CONTEXT_CHARS))
    }
    default: {
      const _exhaustive: never = guideline
      return _exhaustive
    }
  }
}

function toVerifiedPost(content: string): VerifiedPost {
  return content as VerifiedPost
}

export function verifyPost(raw: unknown): VerificationResult {
  const inputResult = validateInput(raw)
  if (!inputResult.ok) {
    return { status: VerificationStatus.Error, error: inputResult.error }
  }

  const { content } = inputResult.value
  const violations = GUIDELINE_RULES.flatMap((rule) => {
    const violation = validateRule(rule, content)
    return violation ? [violation] : []
  })

  if (violations.length > 0) {
    return { status: VerificationStatus.Violation, violations }
  }

  return { status: VerificationStatus.Clean, post: toVerifiedPost(content) }
}

export function isVerifiedPost(
  post: string,
  verificationResult: VerificationResult,
): post is VerifiedPost {
  return (
    verificationResult.status === VerificationStatus.Clean && verificationResult.post === post
  )
}
