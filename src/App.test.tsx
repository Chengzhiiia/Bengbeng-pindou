import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const finishAnimation = () => {
  act(() => {
    vi.advanceTimersByTime(700)
  })
}

const getBoardButtonAt = (coordinate: string) => {
  const button = screen.getAllByRole('button').find((element) => element.getAttribute('aria-label')?.endsWith(` ${coordinate}`))
  if (!button) throw new Error(`Board button ${coordinate} not found`)
  return button
}

const getTrayButton = (slotNumber: number) => {
  const button = document.querySelectorAll<HTMLButtonElement>('.tray-slot')[slotNumber - 1]
  if (!button) throw new Error(`Tray slot ${slotNumber} not found`)
  return button
}

const getBoardViewport = () => {
  const viewport = document.querySelector<HTMLElement>('.board-viewport')
  if (!viewport) throw new Error('Board viewport not found')
  return viewport
}

const getZoomSlider = () => screen.getByRole('slider', { name: '棋盘缩放' }) as HTMLInputElement

const getBoardScale = () => Number(getBoardViewport().style.getPropertyValue('--board-scale'))

const expectBoardButtonSelected = (coordinate: string, selected: boolean) => {
  const cell = getBoardButtonAt(coordinate).closest('.cell')

  expect(cell?.classList.contains('selected')).toBe(selected)
}

const expectTrayButtonSelected = (slotNumber: number, selected: boolean) => {
  expect(getTrayButton(slotNumber).classList.contains('selected')).toBe(selected)
}

describe('App', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the first level board, title, and twelve tray slots', () => {
    render(<App />)

    expect(screen.getByText('第1关')).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: '拼豆棋盘' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /暂存槽/ })).toHaveLength(12)
  })

  it('renders the board inside a scrollable viewport without changing tray capacity', () => {
    render(<App />)

    const board = document.querySelector('[role="grid"]')
    const viewport = board?.closest('.board-viewport')

    expect(viewport).toBeInTheDocument()
    expect(document.querySelectorAll('.tray-slot')).toHaveLength(12)
  })

  it('starts each level with the zoom handle at the bottom and the board minimized', () => {
    render(<App />)

    expect(getZoomSlider()).toHaveValue('0')
    expect(getZoomSlider()).toHaveAttribute('aria-valuenow', '0')
    expect(getBoardViewport().style.getPropertyValue('--board-scale')).toBe('0.72')
  })

  it('enlarges the board when dragging the zoom handle up and shrinks it when dragging down', () => {
    render(<App />)

    fireEvent.change(getZoomSlider(), { target: { value: '100' } })

    expect(getZoomSlider()).toHaveValue('100')
    expect(getBoardViewport().style.getPropertyValue('--board-scale')).toBe('1.1')

    fireEvent.change(getZoomSlider(), { target: { value: '25' } })

    expect(getZoomSlider()).toHaveValue('25')
    expect(getBoardViewport().style.getPropertyValue('--board-scale')).toBe('0.82')
  })

  it('resets board zoom to a full-board minimum when switching levels', () => {
    render(<App />)

    fireEvent.change(getZoomSlider(), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '设置与暂停' })).getByRole('button', { name: '第 2 关' }))

    expect(getZoomSlider()).toHaveValue('0')
    expect(getBoardScale()).toBeLessThan(0.72)
  })

  it('partially moves a large selected board group when the tray has limited space', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '第1关 蓝色宝石 1,0' }))
    fireEvent.click(screen.getByRole('button', { name: '暂存槽 1 空' }))

    expect(screen.getAllByTestId('flying-gem')).toHaveLength(12)
    expect(screen.getByRole('button', { name: '第1关 蓝色宝石 1,0' }).querySelector('.gem')).toBeNull()
    expect(screen.queryAllByRole('button', { name: /暂存槽 \d+ 蓝色宝石/ })).toHaveLength(0)

    finishAnimation()

    expect(screen.getAllByRole('button', { name: /暂存槽 \d+ 蓝色宝石/ })).toHaveLength(12)
    expect(screen.getByRole('button', { name: '第1关 蓝色宝石 5,4' })).toBeInTheDocument()
  })

  it('keeps unmoved board gems selected after a partial move to the tray', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('5,4'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(2))
    finishAnimation()

    expect(document.querySelectorAll('.cell.selected').length).toBeGreaterThan(0)
  })

  it('clears a board gem selection when clicking a selected gem again', () => {
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    expectBoardButtonSelected('1,0', true)

    fireEvent.click(getBoardButtonAt('1,0'))

    expect(document.querySelectorAll('.cell.selected')).toHaveLength(0)
  })

  it('marks selected board gems for lift and flashing animation', () => {
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))

    expect(getBoardButtonAt('1,0').querySelector('.gem')).toHaveClass('gem-selected')

    fireEvent.click(getBoardButtonAt('1,0'))

    expect(getBoardButtonAt('1,0').querySelector('.gem')).not.toHaveClass('gem-selected')
  })

  it('does not draw square frames around selected board gems', () => {
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))

    const selectedCell = getBoardButtonAt('1,0').closest('.cell')
    const appCss = readFileSync('src/App.css', 'utf-8')

    expect(selectedCell).toHaveClass('selected')
    expect(appCss).not.toMatch(/\.cell\.selected\s*\{[^}]*outline/)
    expect(appCss).not.toMatch(/\.cell\.selected::before/)
  })

  it('does not draw backing frames around board edge cells', () => {
    const appCss = readFileSync('src/App.css', 'utf-8')

    expect(appCss).not.toMatch(/\.cell::before/)
    expect(appCss).not.toMatch(/\.cell\.selected::before/)
  })

  it('keeps board cells and gems square on all levels', () => {
    const appCss = readFileSync('src/App.css', 'utf-8')

    expect(appCss).toMatch(/\.cell\s*\{[^}]*aspect-ratio:\s*1/)
    expect(appCss).toMatch(/\.cell-button\s*\{[^}]*aspect-ratio:\s*1/)
    expect(appCss).toMatch(/\.gem\s*\{[^}]*aspect-ratio:\s*1/)
    expect(appCss).not.toMatch(/\.cell\s*\{[^}]*border-radius:\s*\d+px/)
    expect(appCss).not.toMatch(/\.gem\s*\{[^}]*border-radius:\s*\d+px/)
  })

  it('clears a board gem selection when clicking outside the board', () => {
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    expectBoardButtonSelected('1,0', true)

    fireEvent.click(screen.getByRole('status'))

    expect(document.querySelectorAll('.cell.selected')).toHaveLength(0)
  })

  it('switches selection when clicking an unselected board gem', () => {
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getBoardButtonAt('7,0'))

    expectBoardButtonSelected('1,0', false)
    expectBoardButtonSelected('7,0', true)
  })

  it('moves selected board gems directly into matching empty board cells', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '第1关 红色宝石 5,1' }))
    fireEvent.click(screen.getByRole('button', { name: '暂存槽 1 空' }))
    finishAnimation()
    fireEvent.click(screen.getByRole('button', { name: '第1关 蓝色宝石 1,0' }))
    fireEvent.click(screen.getByRole('button', { name: '第1关 蓝色空格 5,1' }))

    expect(screen.getAllByTestId('flying-gem').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '第1关 蓝色空格 5,1' })).toBeInTheDocument()

    finishAnimation()

    expect(screen.getByRole('button', { name: '第1关 蓝色宝石 5,1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第1关 红色空格 1,0' })).toBeInTheDocument()
  })

  it('keeps unmoved board gems selected after a partial move to the board', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('5,4'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    fireEvent.click(getBoardButtonAt('5,1'))
    fireEvent.click(getBoardButtonAt('5,4'))
    finishAnimation()

    expect(document.querySelectorAll('.cell.selected').length).toBeGreaterThan(0)
  })

  it('moves tray gems into matching board cells after the flight animation', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '第1关 蓝色宝石 1,0' }))
    fireEvent.click(screen.getByRole('button', { name: '暂存槽 1 空' }))
    finishAnimation()
    fireEvent.click(screen.getByRole('button', { name: '第1关 红色宝石 5,1' }))
    fireEvent.click(screen.getByRole('button', { name: '第1关 红色空格 1,0' }))
    finishAnimation()
    fireEvent.click(screen.getByRole('button', { name: '暂存槽 1 蓝色宝石' }))
    fireEvent.click(screen.getByRole('button', { name: '第1关 蓝色空格 5,1' }))

    expect(screen.getAllByTestId('flying-gem').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '暂存槽 1 蓝色宝石' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂存槽 1 蓝色宝石' }).querySelector('.gem')).toBeNull()

    finishAnimation()

    expect(screen.getByRole('button', { name: '第1关 蓝色宝石 5,1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂存槽 1 空' })).toBeInTheDocument()
  })

  it('clears a tray gem selection when clicking the selected tray gem again', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    fireEvent.click(getTrayButton(1))
    expectTrayButtonSelected(1, true)

    fireEvent.click(getTrayButton(1))

    expectTrayButtonSelected(1, false)
  })

  it('clears a tray gem selection when clicking outside the board', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    fireEvent.click(getTrayButton(1))
    expectTrayButtonSelected(1, true)

    fireEvent.click(screen.getByRole('status'))

    expectTrayButtonSelected(1, false)
  })

  it('switches from a tray gem selection to a clicked board gem block', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    fireEvent.click(getTrayButton(1))
    expectTrayButtonSelected(1, true)

    fireEvent.click(getBoardButtonAt('5,1'))

    expectTrayButtonSelected(1, false)
    expectBoardButtonSelected('5,1', true)
  })

  it('ignores extra clicks while gems are flying', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '第1关 蓝色宝石 1,0' }))
    fireEvent.click(screen.getByRole('button', { name: '暂存槽 1 空' }))
    fireEvent.click(screen.getByRole('button', { name: '暂存槽 2 空' }))

    expect(screen.getAllByTestId('flying-gem')).toHaveLength(12)

    finishAnimation()

    expect(screen.getAllByRole('button', { name: /暂存槽 \d+ 蓝色宝石/ })).toHaveLength(12)
  })

  it('extends the current failed level by five minutes without resetting progress', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    expect(getTrayButton(1).getAttribute('aria-label')).toContain('蓝色宝石')

    act(() => {
      vi.advanceTimersByTime(300000)
    })

    expect(screen.getByRole('dialog', { name: '时间结束' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '再给嘣5分钟' }))

    expect(screen.queryByRole('dialog', { name: '时间结束' })).not.toBeInTheDocument()
    expect(screen.getByText('05:00')).toBeInTheDocument()
    expect(getTrayButton(1).getAttribute('aria-label')).toContain('蓝色宝石')
  })

  it('styles the failed-level time extension button as white with a blue border', () => {
    const appCss = readFileSync('src/App.css', 'utf-8')

    expect(appCss).toMatch(/\.extend-time-button\s*\{[^}]*background:\s*#fff/)
    expect(appCss).toMatch(/\.extend-time-button\s*\{[^}]*border:\s*3px solid #43a9ef/)
    expect(appCss).toMatch(/\.extend-time-button\s*\{[^}]*color:\s*#43a9ef/)
  })

  it('opens settings without restarting the current board', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()

    fireEvent.click(screen.getByRole('button', { name: '设置' }))

    const dialog = screen.getByRole('dialog', { name: '设置与暂停' })

    expect(dialog).toBeInTheDocument()
    expect(getTrayButton(1).getAttribute('aria-label')).toContain('蓝色宝石')

    fireEvent.click(within(dialog).getByRole('button', { name: '继续' }))

    expect(screen.queryByRole('dialog', { name: '设置与暂停' })).not.toBeInTheDocument()
    expect(getTrayButton(1).getAttribute('aria-label')).toContain('蓝色宝石')
  })

  it('lets the settings panel restart the current level', async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(getBoardButtonAt('1,0'))
    fireEvent.click(getTrayButton(1))
    finishAnimation()
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: '设置与暂停' })).getByRole('button', { name: '重开本关' }))

    expect(screen.queryByRole('dialog', { name: '设置与暂停' })).not.toBeInTheDocument()
    expect(getTrayButton(1).getAttribute('aria-label')).toContain('空')
    expect(getBoardButtonAt('1,0').getAttribute('aria-label')).toContain('蓝色宝石')
  })

  it('pauses the timer while settings are open and can switch levels', async () => {
    vi.useFakeTimers()
    render(<App />)

    expect(screen.getByText('05:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('05:00')).toBeInTheDocument()

    fireEvent.click(within(screen.getByRole('dialog', { name: '设置与暂停' })).getByRole('button', { name: '第 2 关' }))

    expect(screen.queryByRole('dialog', { name: '设置与暂停' })).not.toBeInTheDocument()
    expect(screen.getByText('第2关 洗澡小狗')).toBeInTheDocument()
    expect(screen.getByText('05:00')).toBeInTheDocument()
  })
})
