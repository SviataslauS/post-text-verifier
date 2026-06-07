# Compile-Time Post Verifier

A TypeScript system that verifies whether a text post violates community guidelines. Runtime validators inspect post content; branded types enforce compile-time contracts so unverified strings cannot reach downstream consumers.

## Task

Build a compile-time verification system that checks whether a text post violates a social platform's community guidelines.

This repo answers the take-home questions as follows:

1. **TypeScript type system extensions** — see [TypeScript type system extensions](#typescript-type-system-extensions)
2. **How to verify a user-submitted post** — see [How to verify a user-submitted post](#how-to-verify-a-user-submitted-post)

The implementation is a 4-file `src/` layout: runtime validation in `verifyPost`, compile-time contracts via the branded `VerifiedPost` type.

## How to run

```bash
npm install
npm start                  # or: npx ts-node src/runner.ts
npm test                   # or: npx vitest run
```

## How to verify a user-submitted post

Verification happens in two layers: **runtime checking** at the submission boundary, and **compile-time contracts** for everything downstream.

1. **Receive** structured input as `unknown` — e.g. `{ content: string; authorId?: string }` when the user clicks Submit.
2. **Call** `verifyPost(raw)` in `src/verifier.ts`. It validates input shape, then runs all guideline checks against `content` (every rule runs; all violations are collected in one pass).
3. **Handle the result** — a discriminated union, nothing thrown:
   - `{ status: 'error', error }` — malformed input (missing field, empty content, wrong type)
   - `{ status: 'violation', violations }` — one or more rules failed; each violation has rule, reason, and excerpt
   - `{ status: 'clean', post }` — all checks passed; `post` is a `VerifiedPost`
4. **Pass to downstream consumers** — e.g. `publishPost(post: VerifiedPost)` in `src/runner.ts` rejects raw strings at compile time.

The type guard `isVerifiedPost(post, result)` narrows to `VerifiedPost` after a clean verification result.

## Architecture

TypeScript operates at compile time on types known to the compiler; user-submitted content is a runtime string. The compiler enforces *who may handle* verified content; validators enforce *what the content contains*. Functions that publish or store posts require a `VerifiedPost`, so content cannot reach them without going through `verifyPost` first.

```
runner → verifyPost → validateInput → validateRule(guidelines) → VerifiedPost → publishPost
```

Three rules are defined in `guidelines.ts` (hate speech pattern, 500-char max length, 70% caps ratio). To add a rule: add a member to the `GuidelineRule` enum in `types.ts` and a config entry in `guidelines.ts` — `validateRule` dispatches on `GuidelineKind` automatically.

## Project structure

| File | Purpose |
|------|---------|
| `src/types.ts` | Interfaces, branded types, enums, discriminated unions — no logic |
| `src/guidelines.ts` | Rule config and thresholds — no validation logic |
| `src/verifier.ts` | Input validation, `validateRule` dispatch, `verifyPost`, `VerifiedPost` production |
| `src/runner.ts` | Demo entry — runs sample posts, prints results |
| `tests/fixtures/sample-posts.ts` | Sample post inputs for runner and tests |
| `tests/verifier.test.ts` | Thirteen focused vitest tests |

## TypeScript type system extensions

**Demonstrated in code:**

- Branded types (`VerifiedPost`)
- Discriminated unions (`VerificationResult`, `InputError`)
- Enums (`GuidelineKind`, `GuidelineRule`, `VerificationStatus`, `InputErrorKind`)
- `satisfies` and `as const satisfies` (guidelines config, sample fixtures)
- Type guards (`isVerifiedPost`)
- `Result<T, E>` (input validation)
- Kind-based `validateRule` dispatch

**Also applicable at scale (not implemented):** template literal types, conditional types, recursive types, `infer`, utility type composition, declaration merging.

## Example output

`npm start` runs all sample cases; two representative outputs:

```
[clean post]
status: clean
  post: "Had a great day at the park."
  -> published: "Had a great day at the park."

[hate speech]
status: violation
  rule: noHateSpeech
  reason: Contains hate speech
  excerpt: "I hate everyone who disagr"
```

## Limitations

- Runtime strings cannot be checked at compile time — only literals known to the compiler
- `as VerifiedPost` type assertions bypass the branded type — discipline required
- Regex-based hate speech detection is naive (no l33tspeak, unicode homoglyphs, or context)
- Client-side verification alone is insufficient — production systems need server-side re-verification
