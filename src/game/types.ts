export type PresetGemColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple'
export type HexGemColor = `#${string}`
export type GemColor = PresetGemColor | HexGemColor

export type Cell = {
  id: string
  x: number
  y: number
  targetColor: GemColor
  gemColor?: GemColor
}

export type Level = {
  id: number
  title: string
  timeLimitSeconds: number
  cells: Cell[]
}

export type TraySlot = {
  id: string
  gemColor?: GemColor
}

export type Selection =
  | { source: 'board'; color: GemColor; cellIds: string[] }
  | { source: 'tray'; color: GemColor }
