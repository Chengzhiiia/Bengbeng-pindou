import { describe, expect, it } from 'vitest'
import { levels, validateLevel } from './levels'
import type { GemColor, Level } from './game/types'

const countColors = (level: Level) =>
  level.cells.reduce<Partial<Record<GemColor, number>>>((counts, cell) => {
    counts[cell.targetColor] = (counts[cell.targetColor] ?? 0) + 1
    return counts
  }, {})

describe('levels', () => {
  it('defines six playable levels with balanced gem and target counts', () => {
    expect(levels).toHaveLength(6)
    for (const level of levels) {
      expect(validateLevel(level)).toEqual([])
    }
  })

  it('keeps level 1 introductory and increases gem counts from level 2 onward', () => {
    expect(levels.map((level) => level.cells.length)).toEqual([28, 30, 34, 38, 42, 46])
  })

  it('uses warm household-themed level titles after the tutorial', () => {
    expect(levels.map((level) => level.title)).toEqual([
      '第1关',
      '第2关 小屋',
      '第3关 茶杯',
      '第4关 台灯',
      '第5关 礼物相框',
      '第6关 温馨客厅',
    ])
  })

  it('adds color variety from the second level onward', () => {
    const colorCounts = levels.map((level) => Object.keys(countColors(level)).length)

    expect(colorCounts[0]).toBeLessThan(colorCounts[1])
    expect(colorCounts.slice(1, 4).every((count) => count >= 4)).toBe(true)
    expect(colorCounts.slice(4).every((count) => count === 5)).toBe(true)
  })
})
