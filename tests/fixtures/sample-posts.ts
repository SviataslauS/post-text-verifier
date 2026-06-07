import type { PostInput } from '../../src/types'

export const samplePosts = {
  clean: {
    content: 'Had a great day at the park.',
    authorId: 'user-1',
  },
  hateSpeech: {
    content: 'I hate everyone who disagrees with me.',
    authorId: 'user-2',
  },
  allCaps: {
    content: 'THIS IS COMPLETELY NORMAL TO SAY',
    authorId: 'user-3',
  },
  tooLong: {
    content: 'a'.repeat(501),
    authorId: 'user-4',
  },
  hateAndAllCaps: {
    content: 'I HATE EVERYONE WHO DISAGREES WITH ME',
    authorId: 'user-5',
  },
  emptyContent: {
    content: '',
    authorId: 'user-6',
  },
  whitespaceOnly: {
    content: '   ',
    authorId: 'user-7',
  },
  noAuthorId: {
    content: 'Post without an author field.',
  },
  emptyAuthorId: {
    content: 'Post with an empty authorId.',
    authorId: '',
  },
} as const satisfies Record<string, PostInput>

export const invalidInput = 'not a post object'
