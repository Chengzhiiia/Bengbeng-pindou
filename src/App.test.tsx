import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const finishAnimation = () => {
  act(() => {
    vi.advanceTimersByTime(700)
  })
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
})
