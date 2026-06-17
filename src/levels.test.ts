import { describe, expect, it } from 'vitest'
import { levels, validateLevel } from './levels'
import type { Cell, GemColor, Level } from './game/types'

const countColors = (level: Level) =>
  level.cells.reduce<Partial<Record<GemColor, number>>>((counts, cell) => {
    counts[cell.targetColor] = (counts[cell.targetColor] ?? 0) + 1
    return counts
  }, {})

const originalFirstLevelCells: Cell[] = [
  { id: '1,0', x: 1, y: 0, targetColor: 'red', gemColor: 'blue' },
  { id: '2,0', x: 2, y: 0, targetColor: 'red', gemColor: 'blue' },
  { id: '7,0', x: 7, y: 0, targetColor: 'blue', gemColor: 'red' },
  { id: '8,0', x: 8, y: 0, targetColor: 'blue', gemColor: 'red' },
  { id: '0,1', x: 0, y: 1, targetColor: 'red', gemColor: 'blue' },
  { id: '1,1', x: 1, y: 1, targetColor: 'red', gemColor: 'blue' },
  { id: '2,1', x: 2, y: 1, targetColor: 'red', gemColor: 'blue' },
  { id: '3,1', x: 3, y: 1, targetColor: 'red', gemColor: 'blue' },
  { id: '5,1', x: 5, y: 1, targetColor: 'blue', gemColor: 'red' },
  { id: '6,1', x: 6, y: 1, targetColor: 'blue', gemColor: 'red' },
  { id: '7,1', x: 7, y: 1, targetColor: 'blue', gemColor: 'red' },
  { id: '8,1', x: 8, y: 1, targetColor: 'blue', gemColor: 'red' },
  { id: '9,1', x: 9, y: 1, targetColor: 'blue', gemColor: 'red' },
  { id: '1,2', x: 1, y: 2, targetColor: 'red', gemColor: 'blue' },
  { id: '2,2', x: 2, y: 2, targetColor: 'red', gemColor: 'blue' },
  { id: '3,2', x: 3, y: 2, targetColor: 'red', gemColor: 'blue' },
  { id: '4,2', x: 4, y: 2, targetColor: 'red', gemColor: 'blue' },
  { id: '5,2', x: 5, y: 2, targetColor: 'blue', gemColor: 'red' },
  { id: '6,2', x: 6, y: 2, targetColor: 'blue', gemColor: 'red' },
  { id: '7,2', x: 7, y: 2, targetColor: 'blue', gemColor: 'red' },
  { id: '8,2', x: 8, y: 2, targetColor: 'blue', gemColor: 'red' },
  { id: '2,3', x: 2, y: 3, targetColor: 'red', gemColor: 'blue' },
  { id: '3,3', x: 3, y: 3, targetColor: 'red', gemColor: 'blue' },
  { id: '4,3', x: 4, y: 3, targetColor: 'red', gemColor: 'red' },
  { id: '5,3', x: 5, y: 3, targetColor: 'blue', gemColor: 'red' },
  { id: '6,3', x: 6, y: 3, targetColor: 'blue', gemColor: 'red' },
  { id: '5,4', x: 5, y: 4, targetColor: 'red', gemColor: 'blue' },
  { id: '5,5', x: 5, y: 5, targetColor: 'red', gemColor: 'red' },
]

const connectedMismatchedGemBlocks = (level: Level): number[] => {
  const byPosition = new Map(level.cells.map((cell) => [`${cell.x},${cell.y}`, cell]))
  const visited = new Set<string>()
  const sizes: number[] = []

  for (const cell of level.cells) {
    if (!cell.gemColor || cell.gemColor === cell.targetColor || visited.has(cell.id)) continue

    const stack = [cell]
    visited.add(cell.id)
    let size = 0

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current?.gemColor) continue
      size += 1

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const next = byPosition.get(`${current.x + dx},${current.y + dy}`)
        if (
          next?.gemColor === cell.gemColor &&
          next.gemColor !== next.targetColor &&
          !visited.has(next.id)
        ) {
          visited.add(next.id)
          stack.push(next)
        }
      }
    }

    sizes.push(size)
  }

  return sizes.sort((a, b) => b - a)
}

const connectedGemBlocksByColor = (level: Level): Partial<Record<GemColor, number[]>> => {
  const byPosition = new Map(level.cells.map((cell) => [`${cell.x},${cell.y}`, cell]))
  const visited = new Set<string>()
  const sizesByColor: Partial<Record<GemColor, number[]>> = {}

  for (const cell of level.cells) {
    if (!cell.gemColor || visited.has(cell.id)) continue

    const stack = [cell]
    visited.add(cell.id)
    let size = 0

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current?.gemColor) continue
      size += 1

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const next = byPosition.get(`${current.x + dx},${current.y + dy}`)
        if (next?.gemColor === cell.gemColor && !visited.has(next.id)) {
          visited.add(next.id)
          stack.push(next)
        }
      }
    }

    sizesByColor[cell.gemColor] = [...(sizesByColor[cell.gemColor] ?? []), size]
  }

  return Object.fromEntries(
    Object.entries(sizesByColor).map(([color, sizes]) => [color, (sizes ?? []).sort((a, b) => b - a)]),
  ) as Partial<Record<GemColor, number[]>>
}

const boundingArea = (level: Level) => {
  const xs = level.cells.map(({ x }) => x)
  const ys = level.cells.map(({ y }) => y)
  return (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...ys) - Math.min(...ys) + 1)
}

const shapeSignature = (level: Level) =>
  level.cells
    .map(({ x, y }) => `${x},${y}`)
    .sort()
    .join('|')

const hasCell = (level: Level, x: number, y: number) =>
  level.cells.some((cell) => cell.x === x && cell.y === y)

const cellAt = (level: Level, x: number, y: number) =>
  level.cells.find((cell) => cell.x === x && cell.y === y)

describe('levels', () => {
  it('defines six playable levels with balanced gem and target counts', () => {
    expect(levels).toHaveLength(6)
    for (const level of levels) {
      expect(validateLevel(level)).toEqual([])
    }
  })

  it('keeps the first level unchanged as the introductory level', () => {
    expect(levels[0].cells).toEqual(originalFirstLevelCells)
  })

  it('uses similarly large boards after the introductory level', () => {
    const largeLevelSizes = levels.slice(1).map((level) => level.cells.length)

    expect(largeLevelSizes[0]).toBeGreaterThan(900)
    expect(largeLevelSizes[1]).toBeGreaterThan(900)
    expect(largeLevelSizes.slice(2).every((size) => size >= 200 && size <= 260)).toBe(true)
    expect(Math.max(...largeLevelSizes.slice(2)) - Math.min(...largeLevelSizes.slice(2))).toBeLessThanOrEqual(50)
  })

  it('uses a different non-rectangular silhouette for each large level pattern', () => {
    const largeLevels = levels.slice(1)
    const signatures = new Set(largeLevels.map(shapeSignature))

    expect(signatures.size).toBe(largeLevels.length)
    for (const level of largeLevels) {
      expect(level.cells.length / boundingArea(level)).toBeLessThan(0.92)
    }
  })

  it('uses warm household-themed level titles after the tutorial', () => {
    expect(levels.map((level) => level.title)).toEqual([
      '第1关',
      '第2关 洗澡小狗',
      '第3关 小狗熬夜',
      '第4关 台灯',
      '第5关 礼物相框',
      '第6关 温馨客厅',
    ])
  })

  it('uses the cropped pixel-art bathing dog reference for the second level', () => {
    const secondLevel = levels[1]

    expect(secondLevel.cells).toHaveLength(994)
    expect(cellAt(secondLevel, 16, 0)?.gemColor).toBe('#111111')
    expect(cellAt(secondLevel, 17, 0)?.gemColor).toBe('#111111')
    expect(cellAt(secondLevel, 18, 0)?.gemColor).toBe('#111111')
    expect(cellAt(secondLevel, 16, 1)?.gemColor).toBe('#f2d49c')
    expect(cellAt(secondLevel, 0, 29)?.gemColor).toBe('#75baff')
    expect(cellAt(secondLevel, 30, 29)?.gemColor).toBe('#ff2d2d')
    expect(cellAt(secondLevel, 30, 28)?.gemColor).toBe('#ffd35d')
    expect(cellAt(secondLevel, 31, 24)?.gemColor).toBe('#c77a08')
    expect(hasCell(secondLevel, 0, 0)).toBe(false)
    expect(hasCell(secondLevel, 44, 0)).toBe(false)
  })

  it('uses the cropped pixel-art late-night dog reference for the third level', () => {
    const thirdLevel = levels[2]

    expect(thirdLevel.title).toBe('第3关 小狗熬夜')
    expect(thirdLevel.cells).toHaveLength(1068)
    expect(cellAt(thirdLevel, 13, 0)?.gemColor).toBe('#e4cd55')
    expect(cellAt(thirdLevel, 27, 12)?.gemColor).toBe('#111111')
    expect(cellAt(thirdLevel, 21, 23)?.gemColor).toBe('#fff8ec')
    expect(cellAt(thirdLevel, 34, 16)?.gemColor).toBe('#ae713d')
    expect(cellAt(thirdLevel, 24, 12)?.gemColor).toBe('#d09b52')
    expect(hasCell(thirdLevel, 0, 0)).toBe(false)
    expect(hasCell(thirdLevel, 43, 43)).toBe(false)
  })

  it('adds color variety from the second level onward', () => {
    const colorCounts = levels.map((level) => Object.keys(countColors(level)).length)

    expect(colorCounts[0]).toBeLessThan(colorCounts[1])
    expect(colorCounts[1]).toBeGreaterThan(5)
    expect(colorCounts[2]).toBeGreaterThan(5)
    expect(colorCounts[3]).toBeGreaterThanOrEqual(4)
    expect(colorCounts.slice(4).every((count) => count === 5)).toBe(true)
  })

  it('clusters large same-color mismatched gem blocks for satisfying batch moves', () => {
    for (const level of levels.slice(3)) {
      const blockSizes = connectedMismatchedGemBlocks(level)

      expect(blockSizes.filter((size) => size >= 12).length).toBeGreaterThanOrEqual(3)
      expect(blockSizes.filter((size) => size >= 10).length).toBeGreaterThanOrEqual(6)
      expect(blockSizes.filter((size) => size >= 10).length).toBeLessThanOrEqual(16)
    }
  })

  it('splits each visible gem color into multiple separated blocks on large levels', () => {
    for (const level of levels.slice(3)) {
      const colorBlocks = connectedGemBlocksByColor(level)

      for (const color of Object.keys(countColors(level)) as GemColor[]) {
        const blocks = colorBlocks[color] ?? []

        expect(blocks.length).toBeGreaterThanOrEqual(2)
        expect(blocks[0]).toBeLessThanOrEqual(30)
      }
    }
  })
})
