import type { Cell, GemColor, Level } from './game/types'

const makeCell = (x: number, y: number, targetColor: GemColor, gemColor?: GemColor): Cell => ({
  id: `${x},${y}`,
  x,
  y,
  targetColor,
  gemColor,
})

const makeLevel = (
  id: number,
  title: string,
  timeLimitSeconds: number,
  specs: Array<[number, number, GemColor, GemColor?]>,
): Level => ({
  id,
  title,
  timeLimitSeconds,
  cells: specs.map(([x, y, targetColor, gemColor]) => makeCell(x, y, targetColor, gemColor)),
})

export const levels: Level[] = [
  makeLevel(1, '第1关', 300, [
    [1, 0, 'red', 'blue'],
    [2, 0, 'red', 'blue'],
    [7, 0, 'blue', 'red'],
    [8, 0, 'blue', 'red'],
    [0, 1, 'red', 'blue'],
    [1, 1, 'red', 'blue'],
    [2, 1, 'red', 'blue'],
    [3, 1, 'red', 'blue'],
    [5, 1, 'blue', 'red'],
    [6, 1, 'blue', 'red'],
    [7, 1, 'blue', 'red'],
    [8, 1, 'blue', 'red'],
    [9, 1, 'blue', 'red'],
    [1, 2, 'red', 'blue'],
    [2, 2, 'red', 'blue'],
    [3, 2, 'red', 'blue'],
    [4, 2, 'red', 'blue'],
    [5, 2, 'blue', 'red'],
    [6, 2, 'blue', 'red'],
    [7, 2, 'blue', 'red'],
    [8, 2, 'blue', 'red'],
    [2, 3, 'red', 'blue'],
    [3, 3, 'red', 'blue'],
    [4, 3, 'red', 'red'],
    [5, 3, 'blue', 'red'],
    [6, 3, 'blue', 'red'],
    [5, 4, 'red', 'blue'],
    [5, 5, 'red', 'red'],
  ]),
  makeLevel(2, '第2关', 300, [
    [2, 0, 'yellow', 'green'],
    [3, 0, 'yellow', 'green'],
    [5, 0, 'green', 'yellow'],
    [6, 0, 'green', 'yellow'],
    [1, 1, 'yellow', 'green'],
    [2, 1, 'yellow', 'green'],
    [3, 1, 'yellow', 'green'],
    [4, 1, 'purple', 'purple'],
    [5, 1, 'green', 'yellow'],
    [6, 1, 'green', 'yellow'],
    [7, 1, 'green', 'yellow'],
    [1, 2, 'purple', 'purple'],
    [2, 2, 'yellow', 'green'],
    [3, 2, 'yellow', 'green'],
    [4, 2, 'purple', 'purple'],
    [5, 2, 'green', 'yellow'],
    [6, 2, 'green', 'yellow'],
    [7, 2, 'purple', 'purple'],
    [2, 3, 'yellow', 'green'],
    [3, 3, 'yellow', 'green'],
    [5, 3, 'green', 'yellow'],
    [6, 3, 'green', 'yellow'],
  ]),
  makeLevel(3, '第3关', 300, [
    [2, 0, 'red', 'red'],
    [3, 0, 'red', 'purple'],
    [4, 0, 'blue', 'green'],
    [5, 0, 'blue', 'green'],
    [1, 1, 'red', 'purple'],
    [2, 1, 'red', 'purple'],
    [3, 1, 'yellow', 'yellow'],
    [4, 1, 'yellow', 'yellow'],
    [5, 1, 'blue', 'green'],
    [6, 1, 'blue', 'green'],
    [0, 2, 'purple', 'red'],
    [1, 2, 'purple', 'red'],
    [2, 2, 'yellow', 'yellow'],
    [3, 2, 'yellow', 'yellow'],
    [4, 2, 'green', 'blue'],
    [5, 2, 'green', 'blue'],
    [6, 2, 'green', 'blue'],
    [1, 3, 'purple', 'red'],
    [2, 3, 'purple', 'red'],
    [4, 3, 'green', 'blue'],
    [5, 3, 'green', 'blue'],
    [3, 4, 'red', 'purple'],
    [4, 4, 'blue', 'green'],
  ]),
]

export function validateLevel(level: Level): string[] {
  const errors: string[] = []
  const targetCounts = countColors(level.cells.map(({ targetColor }) => targetColor))
  const gemCounts = countColors(level.cells.map(({ gemColor }) => gemColor).filter(Boolean) as GemColor[])

  for (const color of Object.keys(targetCounts) as GemColor[]) {
    if (targetCounts[color] !== gemCounts[color]) {
      errors.push(`${level.title} ${color} target count ${targetCounts[color]} does not match gem count ${gemCounts[color] ?? 0}`)
    }
  }

  for (const color of Object.keys(gemCounts) as GemColor[]) {
    if (targetCounts[color] !== gemCounts[color]) {
      errors.push(`${level.title} ${color} gem count ${gemCounts[color]} does not match target count ${targetCounts[color] ?? 0}`)
    }
  }

  return errors
}

function countColors(colors: GemColor[]): Partial<Record<GemColor, number>> {
  return colors.reduce<Partial<Record<GemColor, number>>>((counts, color) => {
    counts[color] = (counts[color] ?? 0) + 1
    return counts
  }, {})
}
