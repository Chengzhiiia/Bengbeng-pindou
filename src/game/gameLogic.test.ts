import { describe, expect, it } from 'vitest'
import {
  createTray,
  findConnectedGemGroup,
  getMovePriorityCellIds,
  isLevelSolved,
  moveBoardSelectionToTray,
  moveBoardSelectionToBoard,
  moveTraySelectionToBoard,
} from './gameLogic'
import type { Cell } from './types'

const cell = (
  id: string,
  x: number,
  y: number,
  targetColor: Cell['targetColor'],
  gemColor?: Cell['gemColor'],
): Cell => ({ id, x, y, targetColor, gemColor })

describe('game logic', () => {
  it('selects the eight-direction connected same-color mismatched board group', () => {
    const cells = [
      cell('a', 0, 0, 'red', 'blue'),
      cell('b', 1, 0, 'red', 'blue'),
      cell('c', 2, 0, 'blue', 'blue'),
      cell('d', 0, 1, 'red', 'blue'),
      cell('e', 1, 1, 'blue', 'blue'),
      cell('f', 2, 1, 'red', 'blue'),
    ]

    expect(findConnectedGemGroup(cells, 'a')).toEqual(['a', 'b', 'd', 'f'])
  })

  it('treats diagonal same-color mismatched gems as connected', () => {
    const cells = [
      cell('a', 0, 0, 'red', 'blue'),
      cell('b', 1, 1, 'red', 'blue'),
      cell('c', 2, 2, 'red', 'blue'),
      cell('d', 2, 0, 'red', 'red'),
    ]

    expect(findConnectedGemGroup(cells, 'a')).toEqual(['a', 'b', 'c'])
  })

  it('keeps the clicked gem first and then nearby gems in the selected group order', () => {
    const cells: Cell[] = []
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        cells.push(cell(`${x},${y}`, x, y, 'red', 'blue'))
      }
    }

    expect(findConnectedGemGroup(cells, '1,1').slice(0, 5)).toEqual(['1,1', '1,0', '2,1', '1,2', '0,1'])
  })

  it('does not select a gem that already matches its target cell', () => {
    const cells = [
      cell('a', 0, 0, 'red', 'red'),
      cell('b', 1, 0, 'red', 'red'),
      cell('c', 0, 1, 'blue', 'red'),
    ]

    expect(findConnectedGemGroup(cells, 'a')).toEqual([])
  })

  it('prioritizes the clicked gem and nearby gems when tray capacity is limited', () => {
    const cells: Cell[] = []
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        cells.push(cell(`${x},${y}`, x, y, 'red', 'red'))
      }
    }

    const ordered = getMovePriorityCellIds(cells, ['1,1', '1,0', '2,1', '1,2', '0,1', '0,0', '2,0', '2,2', '0,2'])

    expect(ordered.slice(0, 5)).toEqual(['1,1', '1,0', '2,1', '1,2', '0,1'])
  })

  it('moves only tray-capacity clicked-neighborhood board gems and leaves the rest on board', () => {
    const cells: Cell[] = []
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        cells.push(cell(`${x},${y}`, x, y, 'red', 'red'))
      }
    }
    const tray = createTray(12).map((slot, index) =>
      index < 10 ? { ...slot, gemColor: 'blue' as const } : slot,
    )

    const result = moveBoardSelectionToTray(cells, tray, ['1,1', '1,0', '2,1', '1,2', '0,1', '0,0', '2,0', '2,2', '0,2'])

    expect(result.movedCellIds).toEqual(['1,1', '1,0'])
    expect(result.tray.filter((slot) => slot.gemColor === 'red')).toHaveLength(2)
    expect(result.cells.find(({ id }) => id === '1,1')?.gemColor).toBeUndefined()
    expect(result.cells.find(({ id }) => id === '0,0')?.gemColor).toBe('red')
  })

  it('moves tray gems only into matching target cells', () => {
    const cells = [
      cell('r1', 0, 0, 'red'),
      cell('b1', 1, 0, 'blue'),
      cell('r2', 0, 1, 'red'),
    ]
    const tray = createTray(4)
    tray[0] = { ...tray[0], gemColor: 'red' }
    tray[1] = { ...tray[1], gemColor: 'red' }
    tray[2] = { ...tray[2], gemColor: 'blue' }

    const result = moveTraySelectionToBoard(cells, tray, 'r1', 'red')

    expect(result.placedCellIds).toEqual(['r1', 'r2'])
    expect(result.cells.find(({ id }) => id === 'b1')?.gemColor).toBeUndefined()
    expect(result.tray.filter((slot) => slot.gemColor === 'red')).toHaveLength(0)
    expect(result.tray.filter((slot) => slot.gemColor === 'blue')).toHaveLength(1)
  })

  it('moves tray gems into diagonally connected matching target cells', () => {
    const cells = [
      cell('r1', 0, 0, 'red'),
      cell('r2', 1, 1, 'red'),
      cell('r3', 2, 2, 'red'),
      cell('b1', 1, 0, 'blue'),
    ]
    const tray = createTray(4).map((slot, index) =>
      index < 3 ? { ...slot, gemColor: 'red' as const } : slot,
    )

    const result = moveTraySelectionToBoard(cells, tray, 'r1', 'red')

    expect(result.placedCellIds).toEqual(['r1', 'r2', 'r3'])
    expect(result.cells.find(({ id }) => id === 'r3')?.gemColor).toBe('red')
  })

  it('moves selected board gems directly into matching empty target cells', () => {
    const cells = [
      cell('a', 0, 0, 'red', 'blue'),
      cell('b', 1, 0, 'red', 'blue'),
      cell('c', 2, 0, 'blue'),
      cell('d', 2, 1, 'blue'),
      cell('e', 3, 0, 'red'),
    ]

    const result = moveBoardSelectionToBoard(cells, ['a', 'b'], 'c', 'blue')

    expect(result.placedCellIds).toEqual(['c', 'd'])
    expect(result.movedCellIds).toEqual(['a', 'b'])
    expect(result.cells.find(({ id }) => id === 'a')?.gemColor).toBeUndefined()
    expect(result.cells.find(({ id }) => id === 'c')?.gemColor).toBe('blue')
    expect(result.cells.find(({ id }) => id === 'e')?.gemColor).toBeUndefined()
  })

  it('reports solved only when all cells are correctly filled and tray is empty', () => {
    const solvedCells = [
      cell('r', 0, 0, 'red', 'red'),
      cell('b', 1, 0, 'blue', 'blue'),
    ]

    expect(isLevelSolved(solvedCells, createTray(2))).toBe(true)
    expect(isLevelSolved(solvedCells, [{ id: 'slot-1', gemColor: 'red' }])).toBe(false)
    expect(isLevelSolved([cell('r', 0, 0, 'red', 'blue')], createTray(1))).toBe(false)
  })
})
