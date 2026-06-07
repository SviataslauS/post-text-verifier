export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export interface PostInput {
  readonly content: string
  readonly authorId?: string
}

export enum InputErrorKind {
  InvalidType = 'InvalidType',
  MissingField = 'MissingField',
  EmptyContent = 'EmptyContent',
  WhitespaceOnlyContent = 'WhitespaceOnlyContent',
}

export type InputError =
  | { kind: InputErrorKind.InvalidType; received: string }
  | { kind: InputErrorKind.MissingField; field: 'content' }
  | { kind: InputErrorKind.EmptyContent }
  | { kind: InputErrorKind.WhitespaceOnlyContent }

export type VerifiedPost = string & { readonly __brand: 'VerifiedPost' }

export enum GuidelineKind {
  Pattern = 'pattern',
  Length = 'length',
  Caps = 'caps',
}

export interface PatternGuideline {
  readonly kind: GuidelineKind.Pattern
  readonly pattern: RegExp
  readonly reason: string
}

export interface LengthGuideline {
  readonly kind: GuidelineKind.Length
  readonly maxChars: number
  readonly reason: string
}

export interface CapsGuideline {
  readonly kind: GuidelineKind.Caps
  readonly capsRatio: number
  readonly reason: string
}

export type Guideline = PatternGuideline | LengthGuideline | CapsGuideline

export enum GuidelineRule {
  NoHateSpeech = 'noHateSpeech',
  MaxLength = 'maxLength',
  NoAllCaps = 'noAllCaps',
}

export type GuidelineConfig = Record<GuidelineRule, Guideline>

export interface Violation {
  readonly rule: GuidelineRule
  readonly reason: string
  readonly excerpt: string
}

export enum VerificationStatus {
  Clean = 'clean',
  Violation = 'violation',
  Error = 'error',
}

export type VerificationResult =
  | { status: VerificationStatus.Clean; post: VerifiedPost }
  | { status: VerificationStatus.Violation; violations: readonly Violation[] }
  | { status: VerificationStatus.Error; error: InputError }
