import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'
import {
  colorLabel,
  createTray,
  findConnectedGemGroup,
  isLevelSolved,
  moveBoardSelectionToBoard,
  moveBoardSelectionToTray,
  moveTraySelectionToBoard,
} from './game/gameLogic'
import type { Cell, GemColor, Level, Selection, TraySlot } from './game/types'
import { levels } from './levels'

const traySize = 12
const flightDurationMs = 260
const flightStaggerMs = 20

const colorClass: Record<GemColor, string> = {
  red: 'gem-red',
  blue: 'gem-blue',
  yellow: 'gem-yellow',
  green: 'gem-green',
  purple: 'gem-purple',
}

type RectSnapshot = {
  left: number
  top: number
  width: number
  height: number
}

type FlyingGem = {
  id: string
  color: GemColor
  source: 'board' | 'tray'
  fromId: string
  from: RectSnapshot
  to: RectSnapshot
  delayMs: number
}

function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [cells, setCells] = useState<Cell[]>(() => cloneCells(levels[0]))
  const [tray, setTray] = useState<TraySlot[]>(() => createTray(traySize))
  const [selection, setSelection] = useState<Selection | null>(null)
  const [toast, setToast] = useState('点击棋盘上的宝石，选中同色连通块')
  const [timeLeft, setTimeLeft] = useState(levels[0].timeLimitSeconds)
  const [status, setStatus] = useState<'playing' | 'won' | 'failed'>('playing')
  const [flyingGems, setFlyingGems] = useState<FlyingGem[]>([])
  const boardRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const trayRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const animationTimerRef = useRef<number | null>(null)
  const level = levels[levelIndex]
  const selectedCellIds = selection?.source === 'board' ? new Set(selection.cellIds) : new Set<string>()
  const isAnimating = flyingGems.length > 0
  const hiddenBoardGemIds = new Set(flyingGems.filter((gem) => gem.source === 'board').map((gem) => gem.fromId))
  const hiddenTraySlotIds = new Set(flyingGems.filter((gem) => gem.source === 'tray').map((gem) => gem.fromId))

  useEffect(() => {
    if (status !== 'playing') return
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setStatus('failed')
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [status, levelIndex])

  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current)
      }
    }
  }, [])

  const boardMetrics = useMemo(() => getBoardMetrics(cells), [cells])

  const resetLevel = (nextIndex = levelIndex) => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
    const nextLevel = levels[nextIndex]
    setLevelIndex(nextIndex)
    setCells(cloneCells(nextLevel))
    setTray(createTray(traySize))
    setSelection(null)
    setFlyingGems([])
    setToast('点击棋盘上的宝石，选中同色连通块')
    setTimeLeft(nextLevel.timeLimitSeconds)
    setStatus('playing')
  }

  const completeMove = (nextCells: Cell[], nextTray: TraySlot[], message: string) => {
    setCells(nextCells)
    setTray(nextTray)
    setSelection(null)
    setToast(message)
    if (isLevelSolved(nextCells, nextTray)) {
      setStatus('won')
    }
  }

  const animateMove = (flights: FlyingGem[], nextCells: Cell[], nextTray: TraySlot[], message: string) => {
    if (flights.length === 0) {
      completeMove(nextCells, nextTray, message)
      return
    }

    setSelection(null)
    setFlyingGems(flights)
    animationTimerRef.current = window.setTimeout(
      () => {
        setFlyingGems([])
        animationTimerRef.current = null
        completeMove(nextCells, nextTray, message)
      },
      flightDurationMs + (flights.length - 1) * flightStaggerMs,
    )
  }

  const handleCellClick = (cell: Cell) => {
    if (status !== 'playing' || isAnimating) return

    if (selection?.source === 'tray') {
      const result = moveTraySelectionToBoard(cells, tray, cell.id, selection.color)
      if (result.placedCellIds.length === 0) {
        setToast(`只能放入${colorLabel(selection.color)}空格`)
        return
      }
      const sourceSlotIds = tray
        .filter((slot) => slot.gemColor === selection.color)
        .map((slot) => slot.id)
        .slice(0, result.placedCellIds.length)
      const flights = createFlights('tray', sourceSlotIds, result.placedCellIds, selection.color, trayRefs.current, boardRefs.current)
      animateMove(flights, result.cells, result.tray, `放入 ${result.placedCellIds.length} 颗${colorLabel(selection.color)}宝石`)
      return
    }

    if (selection?.source === 'board' && !cell.gemColor) {
      const result = moveBoardSelectionToBoard(cells, selection.cellIds, cell.id, selection.color)
      if (result.placedCellIds.length === 0) {
        setToast(`只能移动到无宝石的${colorLabel(selection.color)}格子`)
        return
      }
      const partial = result.movedCellIds.length < selection.cellIds.length
      const flights = createFlights('board', result.movedCellIds, result.placedCellIds, selection.color, boardRefs.current, boardRefs.current)
      animateMove(
        flights,
        result.cells,
        tray,
        partial
          ? `已放入 ${result.placedCellIds.length} 颗，剩余宝石保留在棋盘上`
          : `已批量放入 ${result.placedCellIds.length} 颗${colorLabel(selection.color)}宝石`,
      )
      return
    }

    if (!cell.gemColor) {
      setToast('请选择有宝石的格子')
      return
    }

    const cellIds = findConnectedGemGroup(cells, cell.id)
    if (cellIds.length === 0) {
      setSelection(null)
      setToast('这颗宝石已经在正确颜色的格子中')
      return
    }
    setSelection({ source: 'board', color: cell.gemColor, cellIds })
    setToast(`已选中 ${cellIds.length} 颗${colorLabel(cell.gemColor)}宝石，可放入暂存区或同色空格`)
  }

  const handleTrayClick = (slot: TraySlot) => {
    if (status !== 'playing' || isAnimating) return

    if (selection?.source === 'board' && !slot.gemColor) {
      const result = moveBoardSelectionToTray(cells, tray, selection.cellIds)
      if (result.movedCellIds.length === 0) {
        setToast('暂存区已满')
        setSelection(null)
        return
      }
      const partial = result.movedCellIds.length < selection.cellIds.length
      const targetSlotIds = tray
        .filter((traySlot) => !traySlot.gemColor)
        .map((traySlot) => traySlot.id)
        .slice(0, result.movedCellIds.length)
      const flights = createFlights('board', result.movedCellIds, targetSlotIds, selection.color, boardRefs.current, trayRefs.current)
      animateMove(
        flights,
        result.cells,
        result.tray,
        partial
          ? `暂存区剩余空间有限，已优先移动边缘 ${result.movedCellIds.length} 颗`
          : `已移动 ${result.movedCellIds.length} 颗宝石到暂存区`,
      )
      return
    }

    if (slot.gemColor) {
      setSelection({ source: 'tray', color: slot.gemColor })
      setToast(`已选中暂存区的${colorLabel(slot.gemColor)}宝石，点击同色空格放入`)
      return
    }

    setToast(selection ? '点击空暂存槽可移动棋盘选中宝石' : '先选择棋盘宝石或暂存区宝石')
  }

  return (
    <main className="game-shell">
      <header className="hud" aria-label="关卡状态">
        <button className="icon-button" type="button" onClick={() => resetLevel()} aria-label="重开本关">
          ↻
        </button>
        <div className="level-heading">
          <h1>{level.title}</h1>
          <div className="timer" aria-label={`剩余时间 ${formatTime(timeLeft)}`}>
            <span className="timer-icon">◷</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
        <button className="icon-button" type="button" onClick={() => resetLevel()} aria-label="设置">
          ⚙
        </button>
      </header>

      <section className="play-area" aria-label="游戏区域">
        <Board
          level={level}
          cells={cells}
          metrics={boardMetrics}
          selectedCellIds={selectedCellIds}
          hiddenGemIds={hiddenBoardGemIds}
          onCellClick={handleCellClick}
          registerCellRef={(id, node) => {
            boardRefs.current[id] = node
          }}
        />
        <div className="prompt" role="status">
          {toast}
        </div>
      </section>

      <Tray
        tray={tray}
        selectedColor={selection?.source === 'tray' ? selection.color : undefined}
        hiddenSlotIds={hiddenTraySlotIds}
        onTrayClick={handleTrayClick}
        registerSlotRef={(id, node) => {
          trayRefs.current[id] = node
        }}
      />

      {flyingGems.length > 0 && (
        <div className="flight-layer" aria-hidden="true">
          {flyingGems.map((gem) => (
            <span
              key={gem.id}
              data-testid="flying-gem"
              className={`gem flying-gem ${colorClass[gem.color]}`}
              style={getFlightStyle(gem)}
            />
          ))}
        </div>
      )}

      {status !== 'playing' && (
        <WinModal
          won={status === 'won'}
          level={level}
          cells={cells}
          onRetry={() => resetLevel()}
          onNext={() => resetLevel((levelIndex + 1) % levels.length)}
        />
      )}
    </main>
  )
}

type BoardProps = {
  level: Level
  cells: Cell[]
  metrics: ReturnType<typeof getBoardMetrics>
  selectedCellIds: Set<string>
  hiddenGemIds: Set<string>
  onCellClick: (cell: Cell) => void
  registerCellRef: (id: string, node: HTMLButtonElement | null) => void
}

function Board({ level, cells, metrics, selectedCellIds, hiddenGemIds, onCellClick, registerCellRef }: BoardProps) {
  return (
    <div
      className="board"
      role="grid"
      aria-label="拼豆棋盘"
      style={{
        gridTemplateColumns: `repeat(${metrics.columns}, var(--cell-size))`,
        gridTemplateRows: `repeat(${metrics.rows}, var(--cell-size))`,
      }}
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          role="gridcell"
          className={`cell target-${cell.targetColor} ${selectedCellIds.has(cell.id) ? 'selected' : ''}`}
          style={{
            gridColumn: cell.x - metrics.minX + 1,
            gridRow: cell.y - metrics.minY + 1,
          }}
        >
          <button
            ref={(node) => registerCellRef(cell.id, node)}
            type="button"
            className="cell-button"
            aria-label={`${level.title} ${cell.gemColor ? `${colorLabel(cell.gemColor)}宝石` : `${colorLabel(cell.targetColor)}空格`} ${cell.x},${cell.y}`}
            onClick={() => onCellClick(cell)}
          >
            {cell.gemColor && !hiddenGemIds.has(cell.id) && <Gem color={cell.gemColor} />}
          </button>
        </div>
      ))}
    </div>
  )
}

type TrayProps = {
  tray: TraySlot[]
  selectedColor?: GemColor
  hiddenSlotIds: Set<string>
  onTrayClick: (slot: TraySlot) => void
  registerSlotRef: (id: string, node: HTMLButtonElement | null) => void
}

function Tray({ tray, selectedColor, hiddenSlotIds, onTrayClick, registerSlotRef }: TrayProps) {
  return (
    <section className="tray-panel" aria-label="钻石暂存区">
      <div className="tray-row tray-storage">
        {tray.map((slot, index) => (
          <button
            ref={(node) => registerSlotRef(slot.id, node)}
            key={slot.id}
            type="button"
            className={`tray-slot ${slot.gemColor && selectedColor === slot.gemColor ? 'selected' : ''}`}
            aria-label={`暂存槽 ${index + 1} ${slot.gemColor ? `${colorLabel(slot.gemColor)}宝石` : '空'}`}
            onClick={() => onTrayClick(slot)}
          >
            {slot.gemColor && !hiddenSlotIds.has(slot.id) && <Gem color={slot.gemColor} small />}
          </button>
        ))}
      </div>
      <div className="tray-row tray-shadow" aria-hidden="true">
        {tray.map((slot) => (
          <span key={`${slot.id}-shadow`} className="tray-placeholder" />
        ))}
      </div>
      <button className="expand-button" type="button" aria-label="扩容暂未开放">
        扩容
      </button>
    </section>
  )
}

function Gem({ color, small = false }: { color: GemColor; small?: boolean }) {
  return <span className={`gem ${colorClass[color]} ${small ? 'gem-small' : ''}`} />
}

type WinModalProps = {
  won: boolean
  level: Level
  cells: Cell[]
  onRetry: () => void
  onNext: () => void
}

function WinModal({ won, level, cells, onRetry, onNext }: WinModalProps) {
  const metrics = getBoardMetrics(cells)

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={won ? '作品完成' : '时间结束'}>
      <div className="result-modal">
        <div className="ribbon">{won ? '作品完成' : '时间结束'}</div>
        <div
          className="mini-board"
          aria-hidden="true"
          style={{
            gridTemplateColumns: `repeat(${metrics.columns}, 14px)`,
            gridTemplateRows: `repeat(${metrics.rows}, 14px)`,
          }}
        >
          {cells.map((cell) => (
            <span
              key={cell.id}
              className={`mini-cell target-${cell.targetColor}`}
              style={{
                gridColumn: cell.x - metrics.minX + 1,
                gridRow: cell.y - metrics.minY + 1,
              }}
            />
          ))}
        </div>
        <div className="reward">{won ? `${level.title} +2` : '再试一次'}</div>
        <button className="retry-button" type="button" onClick={onRetry}>
          再玩一次
        </button>
        {won && (
          <button className="next-button" type="button" onClick={onNext}>
            下一关
          </button>
        )}
      </div>
    </div>
  )
}

function createFlights(
  source: 'board' | 'tray',
  fromIds: string[],
  toIds: string[],
  color: GemColor,
  fromRefs: Record<string, HTMLButtonElement | null>,
  toRefs: Record<string, HTMLButtonElement | null>,
): FlyingGem[] {
  return fromIds
    .map((fromId, index) => {
      const toId = toIds[index]
      if (!toId) return null
      const from = getGemRect(fromRefs[fromId])
      const to = getGemRect(toRefs[toId])
      if (!from || !to) return null

      return {
        id: `${fromId}-${toId}-${index}`,
        color,
        source,
        fromId,
        from,
        to,
        delayMs: index * flightStaggerMs,
      }
    })
    .filter((flight): flight is FlyingGem => Boolean(flight))
}

function getGemRect(node: HTMLElement | null): RectSnapshot | null {
  if (!node) return null
  const rect = node.getBoundingClientRect()
  const fallbackSize = 32
  const width = rect.width || fallbackSize
  const height = rect.height || fallbackSize
  const size = Math.max(20, Math.min(width, height) * 0.84)
  return {
    left: rect.left + (width - size) / 2,
    top: rect.top + (height - size) / 2,
    width: size,
    height: size,
  }
}

function getFlightStyle(gem: FlyingGem): CSSProperties {
  return {
    left: `${gem.from.left}px`,
    top: `${gem.from.top}px`,
    width: `${gem.from.width}px`,
    height: `${gem.from.height}px`,
    animationDelay: `${gem.delayMs}ms`,
    '--flight-x': `${gem.to.left - gem.from.left}px`,
    '--flight-y': `${gem.to.top - gem.from.top}px`,
  } as CSSProperties
}

function cloneCells(level: Level): Cell[] {
  return level.cells.map((cell) => ({ ...cell }))
}

function getBoardMetrics(cells: Cell[]) {
  const xs = cells.map(({ x }) => x)
  const ys = cells.map(({ y }) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    columns: maxX - minX + 1,
    rows: maxY - minY + 1,
  }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`
}

export default App
