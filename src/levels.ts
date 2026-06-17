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
type PixelColorMap = Record<string, GemColor>

const makeShapedLevel = (id: number, title: string, rows: RowSpans[]): Level =>
  makeLevel(id, title, 300, makeShapedLevelSpecs(rows))

const makePixelArtLevel = (id: number, title: string, rows: string[], colors: PixelColorMap): Level =>
  makeLevel(id, title, 300, makePixelArtLevelSpecs(rows, colors))

const halfScalePixelRows = (rows: string[]): string[] => {
  const maxWidth = Math.max(...rows.map((row) => row.length))
  const scaledRows: string[] = []

  for (let y = 0; y < rows.length; y += 2) {
    let scaledRow = ''

    for (let x = 0; x < maxWidth; x += 2) {
      const tokens = [rows[y]?.[x], rows[y]?.[x + 1], rows[y + 1]?.[x], rows[y + 1]?.[x + 1]].filter(
        (token): token is string => Boolean(token && token !== '.'),
      )
      scaledRow += tokens.length >= 2 ? mostFrequentToken(tokens) : '.'
    }

    scaledRows.push(scaledRow.replace(/\.+$/, ''))
  }

  return scaledRows
}

function mostFrequentToken(tokens: string[]): string {
  const counts = new Map<string, number>()
  let bestToken = tokens[0]
  let bestCount = 0

  for (const token of tokens) {
    const count = (counts.get(token) ?? 0) + 1
    counts.set(token, count)
    if (count > bestCount) {
      bestToken = token
      bestCount = count
    }
  }

  return bestToken
}

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

function makePixelArtLevelSpecs(rows: string[], colors: PixelColorMap): Array<[number, number, GemColor, GemColor]> {
  const pixels = rows.flatMap((row, y) =>
    [...row].flatMap((token, x) => (token === '.' ? [] : [{ x, y, color: colors[token] }])),
  )
  const targetColors = pixels.map(({ color }) => color)
  const gemColors = makeBalancedTargetColors(targetColors)

  return pixels.map(({ x, y }, index) => [x, y, targetColors[index], gemColors[index]])
}

function gemColorForPosition(x: number, y: number, minX: number, width: number): GemColor {
  const tileX = Math.floor(((x - minX) / width) * largeBoardColors.length)
  const tileY = Math.floor(y / 4)
  return largeBoardColors[(tileX + tileY * 2) % largeBoardColors.length]
}

const bathingDogPixelColors: PixelColorMap = {
  K: '#111111',
  F: '#f2d49c',
  S: '#d99523',
  B: '#75baff',
  D: '#4c9df5',
  L: '#b9dcff',
  W: '#f7fbff',
  Y: '#ffd35d',
  O: '#c77a08',
  R: '#ff2d2d',
}

const bathingDogPixelRows = [
  '................KKK..........................',
  '...............KFFFK.........................',
  '...............KFFFFK........................',
  '.............LLBFFFFK........................',
  '....KKFK....LLFFLFFFK........................',
  '...KFFFFFKKBL...FLFFF........................',
  '..KFFFFFFFFBF...FFB.FB.......................',
  '..KFFFFFFFFFFFFFFFFFFB.......................',
  '...KFFFFFFFFFFFFFFFFFKK......................',
  '....KKKFFFFFFFFFFFFFFFFK.....................',
  '........KFFFFFFFFFFFFFFFK....................',
  '.......KFFFFFFFFFFFFFFFFK....................',
  '.......KFFFKFFKFFKFFFFFFF....................',
  '......KFFFFKFFFFFKKKFFFFF....................',
  '......KFFFFKFFFKKFFFFFFFK....................',
  '......KFFFKFFFFFFFFFFFKKK....................',
  '......KFFFKFFFFFFFFFFKFFF....................',
  '......KFFFFLF.FFKKKFFKFFF....................',
  '......KFFFL..LKKSOOOKKFFF....................',
  '......KFFFF.FK.KOOOOKKFFF....................',
  '......KFFFFFFKWKOOSKFFFKK....................',
  '......KFFFFLFFKKKKFFFFFFK....................',
  '......KFFFFFFFFFFFFFFFFFFK.......KKKKKK......',
  '.......KFFFFFFFFFFKFFFFFFBBB..KKKOSOOOOKK....',
  '.....BBKKFFFFFFFFFFKFFFFKBBBBBKOSSSSSSSSOK...',
  '...BBBBKOKKFFFFFFFKKKKKKBBBBBKOSBBBBLLLBOK...',
  '..BBBBBKKFOKKKKKKKKOFSFKBBBBBKKKBBBBBBBBKK...',
  '.BBBBBBBKKKSFOFFOOSKKKBBBBBBBKFKKKKKKKKKYKB..',
  'BBBBBBBKFFOKKKKKKKKKKSKBBBBBBKYYYYYYYYYYYKBB.',
  'BBBBBBBKKKFFFFOKBBKKKKKBBBBBBKRRYYYYYYYYRKBBB',
  'BBBBBBBBBBKKOOKBBBBBKKBBBBBBBKYYRRRRRRRRYKBBB',
  'BBBBBBBBBBBBKKKBBBBBBBBBBBBBBBYYYFYFYYFYYKBBB',
  '.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBKKKFYFKKYKKBBBB',
  '.LBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  '...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.',
  '.....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..',
  '......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.....',
  '........LBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......',
  '............BBBBBBBBBBBBBBBBBBBBBBB..........',
]

const lateNightDogPixelColors: PixelColorMap = {
  K: '#111111',
  Y: '#e4cd55',
  C: '#fff8ec',
  F: '#e0c980',
  O: '#ae713d',
  M: '#d09b52',
}

const lateNightDogPixelRows = [
  '.............YYYYYYYYYYYC......YYYYYYYYY....',
  '.............YYYYYYYYYYYY.....YYYYYYYYYY....',
  '..............YYYYYYYYYYY.....YYYYYYYYYC....',
  '..............FYYYYYYYYYY.....YYYYYYYYY.....',
  '...............YYYYYYYYYYY...YYYYYYYYY......',
  '...............CYYYYYYYYYY...YYYYYYYYC......',
  '................YYYYYYYYYY...YYYYYYYY.......',
  '.................YYYYYYYYY...YYYYYYYY.......',
  '..................YYYYYYYY..CYYYYYYY........',
  '..................YYYYYYYYY.YYYYYYYY........',
  '...................YYYYYYYY.YYYYYYY.........',
  '...................YYYYYYYYKYYYYYY..........',
  '....................YYYYMMKKKYYYYY..........',
  '.....................KYYYYOOMMYMMKK.........',
  '....................KKYYYYOOOYYYYOKK........',
  '....................KOFYYYOOOYYYOOOOKK......',
  '....................KOOYYYOOYYYYOOOOOKK.....',
  '....................KOOOYYOOYYYOOOOOOOK.....',
  '....................KOOKKMKKYYOOOOOOOOOK....',
  '..................KKKKKFFFFFFYKOOOOOOOOKK...',
  '.................KKKKFFFFFFFCFFFKOOOOOOOK...',
  '..............KKKKKKKFFKFKKFFFFFFKKOOOOOOK..',
  '............KKCCCCCCCKKCKCKKFFFFFFFKKOOOOK..',
  '...........KKCCCCCCCCCCCCKKFKKFFFFFFFKOOOK..',
  '..........KKCCCCCCCCCCCCCCCKFFKFFFFFFKOOOK..',
  '..........KCCCCCCCCCCCCCCCCKFFKFKKFFFKOOOK..',
  '.........KCCCCCCCCCCCCCCCCCCKKCKKKKKKKOOOK..',
  '........KKCCCCCCCCCCCCCCCCCCCCCCKKK...KKKK..',
  '.......KKCCCCCCCCCCCCCCCCCCCCCCCCKK....KKK..',
  '.....KKKCCCCCCCCCCCCCCCCCCCCCCCCCCK...KKFK..',
  '....KKKKCCCCCCCCCCCCCCCCCCCCCCCCCCK..KKFFK..',
  '...KK..KCCCCCCCCCCCCCCCCCCCCCCCCCCK..KFFFK..',
  '...KFK.KKKCCCCCCCCCCCCCCCCCCCCCCCCK.KFFFKK..',
  '...KFFKK.KKCCCCCCCCCCCCCCCCCCCCCCKKKFFFFK...',
  '...KFFFKK.KKCCCCCCCCCCCCCCCCCCCCKKKFFFFK....',
  '...KFFFFKK.KKCCCCCCCCCCCCCCCCCCCKKFFFFK.....',
  '....KKFFFFKKKKKCCCCCCCCCCCCCCCKKKFFFFK......',
  '......KFFFFKKKKKCCCCCCCCCCCCCKKKKFFFK.......',
  '......KKKFFFFKKKKKKCCCCCCCCCKK.KFFFKK.......',
  '........KKFFFFKK.KKKKKKKKCKKK.KFFFKK........',
  '..........KFFFFKKKK......K...KFFFFK.........',
  '...........KKFFFFKK.........KFFFFKK.........',
  '.............KKFFFFKK......KFFFFKK..........',
  '...............KFFFFFK....KFFFFKK...........',
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
  makePixelArtLevel(2, '第2关 洗澡小狗', halfScalePixelRows(bathingDogPixelRows), bathingDogPixelColors),
  makePixelArtLevel(3, '第3关 小狗熬夜', halfScalePixelRows(lateNightDogPixelRows), lateNightDogPixelColors),
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
