import { describe, expect, it } from 'vitest'
import { getCompletionProgress } from './levelProgression'

describe('level progression', () => {
  it('advances to the next level when one is available', () => {
    expect(getCompletionProgress(0, 3)).toEqual({
      status: 'won',
      nextLevelIndex: 1,
      isFinalLevel: false,
    })
  })

  it('marks the game completed after the final level instead of looping to the first level', () => {
    expect(getCompletionProgress(2, 3)).toEqual({
      status: 'completed',
      nextLevelIndex: null,
      isFinalLevel: true,
    })
  })
})
