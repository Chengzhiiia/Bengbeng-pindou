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

const largeBoardColors: GemColor[] = ['red', 'blue', 'yellow', 'green', 'purple']
type RowSpans = Array<[number, number]>

const makeShapedLevel = (id: number, title: string, rows: RowSpans[]): Level =>
  makeLevel(id, title, 300, makeShapedLevelSpecs(rows))

function makeShapedLevelSpecs(rows: RowSpans[]): Array<[number, number, GemColor, GemColor]> {
  const positions = rows.flatMap((spans, y) =>
    spans.flatMap(([startX, endX]) =>
      Array.from({ length: endX - startX + 1 }, (_, offset) => ({ x: startX + offset, y })),
    ),
  )
  const minX = Math.min(...positions.map(({ x }) => x))
  const maxX = Math.max(...positions.map(({ x }) => x))
  const width = maxX - minX + 1
  const gemColors = positions.map(({ x, y }) => gemColorForPosition(x, y, minX, width))
  const targetColors = makeBalancedTargetColors(gemColors)

  return positions.map(({ x, y }, index) => [x, y, targetColors[index], gemColors[index]])
}

function makeBalancedTargetColors(gemColors: GemColor[]): GemColor[] {
  const offset = Math.ceil(gemColors.length / 2)
  return gemColors.map((_, index) => gemColors[(index + offset) % gemColors.length])
}

function gemColorForPosition(x: number, y: number, minX: number, width: number): GemColor {
  const tileX = Math.floor(((x - minX) / width) * largeBoardColors.length)
  const tileY = Math.floor(y / 4)
  return largeBoardColors[(tileX + tileY * 2) % largeBoardColors.length]
}

const bathingDogRows: RowSpans[] = [
  [[8, 10]],
  [[3, 7], [8, 12]],
  [[1, 12]],
  [[2, 13]],
  [[3, 14]],
  [[3, 13], [19, 23]],
  [[4, 14], [18, 24]],
  [[4, 15], [18, 24]],
  [[3, 16], [18, 24]],
  [[2, 17], [19, 24]],
  [[2, 18], [20, 24]],
  [[1, 21]],
  [[2, 20]],
  [[4, 18]],
]

const cupRows: RowSpans[] = [
  [[5, 18]],
  [[4, 19]],
  [[3, 20]],
  [[2, 21], [23, 24]],
  [[2, 21], [23, 24]],
  [[2, 21], [22, 24]],
  [[2, 21], [21, 24]],
  [[3, 20], [21, 23]],
  [[4, 19]],
  [[5, 18]],
  [[4, 19]],
  [[3, 20]],
  [[1, 22]],
]

const lampRows: RowSpans[] = [
  [[9, 16]],
  [[7, 18]],
  [[5, 20]],
  [[4, 21]],
  [[3, 22]],
  [[4, 21]],
  [[5, 20]],
  [[7, 18]],
  [[11, 14]],
  [[11, 14]],
  [[10, 15]],
  [[9, 16]],
  [[6, 19]],
  [[4, 21]],
  [[2, 23]],
  [[1, 24]],
]

const giftRows: RowSpans[] = [
  [[4, 9], [14, 19]],
  [[3, 20]],
  [[2, 21]],
  [[2, 21]],
  [[2, 21]],
  [[2, 21]],
  [[2, 21]],
  [[2, 21]],
  [[2, 21]],
  [[3, 20]],
  [[4, 19]],
  [[5, 18]],
]

const roomRows: RowSpans[] = [
  [[8, 15]],
  [[6, 17]],
  [[4, 19]],
  [[3, 20]],
  [[2, 21]],
  [[2, 21]],
  [[1, 22]],
  [[1, 22]],
  [[2, 21]],
  [[2, 21]],
  [[3, 20]],
  [[5, 18]],
  [[7, 16]],
]

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
  makeShapedLevel(2, '第2关 洗澡小狗', bathingDogRows),
  makeShapedLevel(3, '第3关 茶杯', cupRows),
  makeShapedLevel(4, '第4关 台灯', lampRows),
  makeShapedLevel(5, '第5关 礼物相框', giftRows),
  makeShapedLevel(6, '第6关 温馨客厅', roomRows),
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
