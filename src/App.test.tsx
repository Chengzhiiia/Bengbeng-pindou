import { fireEvent, render, screen, within } from '@testing-library/react'
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
    expect(screen.getByText('第2关 小屋')).toBeInTheDocument()
    expect(screen.getByText('05:00')).toBeInTheDocument()
  })
})
