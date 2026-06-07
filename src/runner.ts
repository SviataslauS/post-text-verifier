import { verifyPost } from './verifier'
import { VerificationStatus, type VerifiedPost, type VerificationResult } from './types'
import { invalidInput, samplePosts } from '../tests/fixtures/sample-posts'

// publishPost(rawString) — TS error: not assignable to VerifiedPost
function publishPost(post: VerifiedPost): void {
  console.log(`  -> published: "${post}"`)
}

interface SampleCase {
  label: string
  input: unknown
}

const sampleCases: SampleCase[] = [
  { label: 'clean post', input: samplePosts.clean },
  { label: 'hate speech', input: samplePosts.hateSpeech },
  { label: 'all caps', input: samplePosts.allCaps },
  { label: 'too long', input: samplePosts.tooLong },
  { label: 'hate + all caps', input: samplePosts.hateAndAllCaps },
  { label: 'empty content', input: samplePosts.emptyContent },
  { label: 'whitespace only', input: samplePosts.whitespaceOnly },
  { label: 'no authorId', input: samplePosts.noAuthorId },
  { label: 'empty authorId', input: samplePosts.emptyAuthorId },
  { label: 'invalid input type', input: invalidInput },
]

function formatResult(result: VerificationResult): string {
  switch (result.status) {
    case VerificationStatus.Clean:
      return `status: clean\n  post: "${result.post}"`
    case VerificationStatus.Violation:
      return result.violations
        .map(
          (v) =>
            `status: violation\n  rule: ${v.rule}\n  reason: ${v.reason}\n  excerpt: "${v.excerpt}"`,
        )
        .join('\n---\n')
    case VerificationStatus.Error:
      return `status: error\n  kind: ${result.error.kind}${
        'field' in result.error ? `\n  field: ${result.error.field}` : ''
      }${'received' in result.error ? `\n  received: ${result.error.received}` : ''}`
    default: {
      const _exhaustive: never = result
      return _exhaustive
    }
  }
}

for (const { label, input } of sampleCases) {
  const result = verifyPost(input)
  console.log(`[${label}]`)
  console.log(formatResult(result))
  if (result.status === VerificationStatus.Clean) {
    publishPost(result.post)
  }
  console.log()
}
