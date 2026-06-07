import { describe, expect, it } from 'vitest'
import { isVerifiedPost, verifyPost } from '../src/verifier'
import { guidelines } from '../src/guidelines'
import {
  GuidelineRule,
  InputErrorKind,
  VerificationStatus,
} from '../src/types'
import { invalidInput, samplePosts } from './fixtures/sample-posts'

describe('verifyPost', () => {
  it('returns VerifiedPost for a post that violates no guidelines', () => {
    const result = verifyPost(samplePosts.clean)

    expect(result.status).toBe(VerificationStatus.Clean)
    if (result.status === VerificationStatus.Clean) {
      expect(result.post).toBe(samplePosts.clean.content)
    }
  })

  it('returns violation with correct rule name for a hate speech post', () => {
    const result = verifyPost(samplePosts.hateSpeech)

    expect(result.status).toBe(VerificationStatus.Violation)
    if (result.status === VerificationStatus.Violation) {
      expect(
        result.violations.some((v) => v.rule === GuidelineRule.NoHateSpeech),
      ).toBe(true)
    }
  })

  it('collects multiple violations when a post fails more than one rule', () => {
    const result = verifyPost(samplePosts.hateAndAllCaps)

    expect(result.status).toBe(VerificationStatus.Violation)
    if (result.status === VerificationStatus.Violation) {
      expect(result.violations.length).toBeGreaterThan(1)
      expect(result.violations.map((v) => v.rule)).toContain(
        GuidelineRule.NoHateSpeech,
      )
      expect(result.violations.map((v) => v.rule)).toContain(
        GuidelineRule.NoAllCaps,
      )
    }
  })

  it('accepts a post with no or empty authorId', () => {
    expect(verifyPost(samplePosts.noAuthorId).status).toBe(VerificationStatus.Clean)
    expect(verifyPost(samplePosts.emptyAuthorId).status).toBe(VerificationStatus.Clean)
  })

  it('returns error for empty content', () => {
    const result = verifyPost(samplePosts.emptyContent)
    expect(result.status).toBe(VerificationStatus.Error)
    if (result.status === VerificationStatus.Error) {
      expect(result.error.kind).toBe(InputErrorKind.EmptyContent)
    }
  })

  it('returns error for whitespace-only content', () => {
    const result = verifyPost(samplePosts.whitespaceOnly)
    expect(result.status).toBe(VerificationStatus.Error)
    if (result.status === VerificationStatus.Error) {
      expect(result.error.kind).toBe(InputErrorKind.WhitespaceOnlyContent)
    }
  })

  it('returns violation for post exceeding max length', () => {
    const result = verifyPost(samplePosts.tooLong)
    expect(result.status).toBe(VerificationStatus.Violation)
    if (result.status === VerificationStatus.Violation) {
      expect(result.violations.some((v) => v.rule === GuidelineRule.MaxLength)).toBe(
        true,
      )
    }
  })

  it('returns violation for all-caps post', () => {
    const result = verifyPost(samplePosts.allCaps)
    expect(result.status).toBe(VerificationStatus.Violation)
    if (result.status === VerificationStatus.Violation) {
      expect(result.violations.some((v) => v.rule === GuidelineRule.NoAllCaps)).toBe(
        true,
      )
    }
  })

  it('returns error for invalid input type', () => {
    const result = verifyPost(invalidInput)
    expect(result.status).toBe(VerificationStatus.Error)
    if (result.status === VerificationStatus.Error) {
      expect(result.error.kind).toBe(InputErrorKind.InvalidType)
    }
  })

  it('returns error when content field is missing', () => {
    const result = verifyPost({ authorId: 'user-1' })
    expect(result.status).toBe(VerificationStatus.Error)
    if (result.status === VerificationStatus.Error) {
      expect(result.error.kind).toBe(InputErrorKind.MissingField)
    }
  })

  it('includes guideline reason on each violation', () => {
    const result = verifyPost(samplePosts.hateSpeech)
    expect(result.status).toBe(VerificationStatus.Violation)
    if (result.status === VerificationStatus.Violation) {
      const violation = result.violations.find(
        (v) => v.rule === GuidelineRule.NoHateSpeech,
      )
      expect(violation?.reason).toBe(
        guidelines[GuidelineRule.NoHateSpeech].reason,
      )
    }
  })
})

describe('isVerifiedPost', () => {
  it('narrows to VerifiedPost only when content matches a clean result', () => {
    const raw = 'Had a great day at the park.'
    const result = verifyPost(samplePosts.clean)

    expect(isVerifiedPost(raw, result)).toBe(true)
    expect(isVerifiedPost('unverified string', result)).toBe(false)
  })

  it('returns false when verification result is not clean', () => {
    const result = verifyPost(samplePosts.hateSpeech)
    expect(isVerifiedPost('I hate everyone who disagrees with me.', result)).toBe(
      false,
    )
  })
})
