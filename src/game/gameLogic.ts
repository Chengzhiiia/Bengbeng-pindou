import type { Cell, GemColor, TraySlot } from './types'

const directions = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const

const keyFor = (x: number, y: number) => `${x},${y}`

export function createTray(size: number): TraySlot[] {
  return Array.from({ length: size }, (_, index) => ({ id: `slot-${index + 1}` }))
}

export function findConnectedGemGroup(cells: Cell[], startCellId: string): string[] {
  const start = cells.find(({ id }) => id === startCellId)
  if (!isMismatchedGem(start)) return []

  const byPosition = new Map(cells.map((cell) => [keyFor(cell.x, cell.y), cell]))
  const visited = new Set<string>()
  const queue = [start]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current.id)) continue
    visited.add(current.id)

    for (const [dx, dy] of directions) {
      const next = byPosition.get(keyFor(current.x + dx, current.y + dy))
      if (isMismatchedGem(next, start.gemColor) && !visited.has(next.id)) {
        queue.push(next)
      }
    }
  }

  return [...visited]
}

export function getMovePriorityCellIds(cells: Cell[], selectedCellIds: string[]): string[] {
  return selectedCellIds.filter((id) => byId(cells, id))
}

export function moveBoardSelectionToTray(
  cells: Cell[],
  tray: TraySlot[],
  selectedCellIds: string[],
): { cells: Cell[]; tray: TraySlot[]; movedCellIds: string[] } {
  const openSlots = tray.filter((slot) => !slot.gemColor).length
  const movedCellIds = getMovePriorityCellIds(cells, selectedCellIds).slice(0, openSlots)
  const moved = new Set(movedCellIds)
  const movedGems = movedCellIds
    .map((id) => byId(cells, id)?.gemColor)
    .filter((color): color is GemColor => Boolean(color))

  let gemIndex = 0
  const nextTray = tray.map((slot) => {
    if (slot.gemColor || gemIndex >= movedGems.length) return slot
    const gemColor = movedGems[gemIndex]
    gemIndex += 1
    return { ...slot, gemColor }
  })

  const nextCells = cells.map((cell) => (moved.has(cell.id) ? { ...cell, gemColor: undefined } : cell))

  return { cells: nextCells, tray: nextTray, movedCellIds }
}

export function moveBoardSelectionToBoard(
  cells: Cell[],
  selectedCellIds: string[],
  targetCellId: string,
  color: GemColor,
): { cells: Cell[]; movedCellIds: string[]; placedCellIds: string[] } {
  const target = byId(cells, targetCellId)
  if (!target || target.targetColor !== color || target.gemColor) {
    return { cells, movedCellIds: [], placedCellIds: [] }
  }

  const placementCellIds = getPlacementCellIds(cells, targetCellId, color)
  const movedCellIds = getMovePriorityCellIds(cells, selectedCellIds).slice(0, placementCellIds.length)
  const placedCellIds = placementCellIds.slice(0, movedCellIds.length)
  const moved = new Set(movedCellIds)
  const placed = new Set(placedCellIds)

  const nextCells = cells.map((cell) => {
    if (moved.has(cell.id)) return { ...cell, gemColor: undefined }
    if (placed.has(cell.id)) return { ...cell, gemColor: color }
    return cell
  })

  return { cells: nextCells, movedCellIds, placedCellIds }
}

export function moveTraySelectionToBoard(
  cells: Cell[],
  tray: TraySlot[],
  targetCellId: string,
  color: GemColor,
): { cells: Cell[]; tray: TraySlot[]; placedCellIds: string[] } {
  const target = byId(cells, targetCellId)
  if (!target || target.targetColor !== color || target.gemColor) {
    return { cells, tray, placedCellIds: [] }
  }

  const availableGemSlotIds = tray.filter((slot) => slot.gemColor === color).map(({ id }) => id)
  const placementCellIds = getPlacementCellIds(cells, targetCellId, color).slice(0, availableGemSlotIds.length)
  const placed = new Set(placementCellIds)
  let placedCount = 0

  const nextCells = cells.map((cell) => (placed.has(cell.id) ? { ...cell, gemColor: color } : cell))
  const nextTray = tray.map((slot) => {
    if (slot.gemColor !== color || placedCount >= placementCellIds.length) return slot
    placedCount += 1
    return { ...slot, gemColor: undefined }
  })

  return { cells: nextCells, tray: nextTray, placedCellIds: placementCellIds }
}

export function isLevelSolved(cells: Cell[], tray: TraySlot[]): boolean {
  return cells.every((cell) => cell.gemColor === cell.targetColor) && tray.every((slot) => !slot.gemColor)
}

export function colorLabel(color: GemColor): string {
  const labels: Record<string, string> = {
    red: '红色',
    blue: '蓝色',
    yellow: '黄色',
    green: '绿色',
    purple: '紫色',
  }
  return labels[color] ?? color
}

function getPlacementCellIds(cells: Cell[], startCellId: string, color: GemColor): string[] {
  const start = byId(cells, startCellId)
  if (!start || start.targetColor !== color || start.gemColor) return []

  const byPosition = new Map(cells.map((cell) => [keyFor(cell.x, cell.y), cell]))
  const visited = new Set<string>()
  const queue = [start]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current.id)) continue
    visited.add(current.id)

    for (const [dx, dy] of directions) {
      const next = byPosition.get(keyFor(current.x + dx, current.y + dy))
      if (next?.targetColor === color && !next.gemColor && !visited.has(next.id)) {
        queue.push(next)
      }
    }
  }

  return [startCellId, ...[...visited].filter((id) => id !== startCellId).sort((a, b) => sortCellsByPosition(cells, a, b))]
}

function byId(cells: Cell[], id: string): Cell | undefined {
  return cells.find((cell) => cell.id === id)
}

function isMismatchedGem(cell: Cell | undefined, color?: GemColor): cell is Cell & { gemColor: GemColor } {
  return Boolean(cell?.gemColor && cell.gemColor !== cell.targetColor && (!color || cell.gemColor === color))
}

function sortCellsByPosition(cells: Cell[], a: string, b: string): number {
  const cellA = byId(cells, a)
  const cellB = byId(cells, b)
  if (!cellA || !cellB) return a.localeCompare(b)
  return cellA.y - cellB.y || cellA.x - cellB.x
}
