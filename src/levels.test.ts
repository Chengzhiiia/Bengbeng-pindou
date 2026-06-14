import { describe, expect, it } from 'vitest'
import { levels, validateLevel } from './levels'

describe('levels', () => {
  it('defines three playable levels with balanced gem and target counts', () => {
    expect(levels).toHaveLength(3)
    for (const level of levels) {
      expect(validateLevel(level)).toEqual([])
    }
  })
})
