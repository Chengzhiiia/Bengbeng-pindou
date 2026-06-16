# Level Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep level 1 simple and replace levels 2-6 with progressively harder warm household-themed gem patterns.

**Architecture:** The game already stores level definitions as `Cell` arrays in `src/levels.ts`. This change stays inside that model: tests describe the desired difficulty curve, then level data is replaced with balanced target/gem color arrays.

**Tech Stack:** React, TypeScript, Vitest, Vite.

---

## File Structure

- Modify `src/levels.test.ts`: add test helpers and assertions for gem counts, color variety, and level titles.
- Modify `src/levels.ts`: update level titles and replace level 2-6 coordinate specs with household-themed patterns.

## Task 1: Add Difficulty-Curve Tests

**Files:**
- Modify: `src/levels.test.ts`

- [ ] **Step 1: Write the failing test**

Replace `src/levels.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { levels, validateLevel } from './levels'
import type { GemColor, Level } from './game/types'

const countColors = (level: Level) =>
  level.cells.reduce<Partial<Record<GemColor, number>>>((counts, cell) => {
    counts[cell.targetColor] = (counts[cell.targetColor] ?? 0) + 1
    return counts
  }, {})

describe('levels', () => {
  it('defines six playable levels with balanced gem and target counts', () => {
    expect(levels).toHaveLength(6)
    for (const level of levels) {
      expect(validateLevel(level)).toEqual([])
    }
  })

  it('keeps level 1 introductory and increases gem counts from level 2 onward', () => {
    expect(levels.map((level) => level.cells.length)).toEqual([18, 26, 30, 34, 38, 42])
  })

  it('uses warm household-themed level titles after the tutorial', () => {
    expect(levels.map((level) => level.title)).toEqual([
      '第1关',
      '第2关 小屋',
      '第3关 茶杯',
      '第4关 台灯',
      '第5关 礼物相框',
      '第6关 温馨客厅',
    ])
  })

  it('adds color variety from the second level onward', () => {
    const colorCounts = levels.map((level) => Object.keys(countColors(level)).length)

    expect(colorCounts[0]).toBeLessThan(colorCounts[1])
    expect(colorCounts.slice(1, 4).every((count) => count >= 4)).toBe(true)
    expect(colorCounts.slice(4).every((count) => count === 5)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/levels.test.ts`

Expected: FAIL because current level counts and titles do not match the new progression.

- [ ] **Step 3: Commit the failing test only if requested**

Do not commit the red state by default. Continue to Task 2 in the same working tree, then commit the passing implementation.

## Task 2: Replace Level Data

**Files:**
- Modify: `src/levels.ts`

- [ ] **Step 1: Write minimal implementation**

Replace the `levels` array in `src/levels.ts` with six `makeLevel(...)` entries:

```ts
export const levels: Level[] = [
  makeLevel(1, '第1关', 300, [
    [1, 0, 'red', 'blue'],
    [2, 0, 'red', 'blue'],
    [7, 0, 'blue', 'red'],
    [8, 0, 'blue', 'red'],
    [1, 1, 'red', 'blue'],
    [2, 1, 'red', 'blue'],
    [3, 1, 'red', 'blue'],
    [6, 1, 'blue', 'red'],
    [7, 1, 'blue', 'red'],
    [8, 1, 'blue', 'red'],
    [2, 2, 'red', 'blue'],
    [3, 2, 'red', 'blue'],
    [6, 2, 'blue', 'red'],
    [7, 2, 'blue', 'red'],
    [3, 3, 'red', 'red'],
    [6, 3, 'blue', 'blue'],
    [4, 4, 'red', 'red'],
    [5, 4, 'blue', 'blue'],
  ]),
  makeLevel(2, '第2关 小屋', 300, [
    [3, 0, 'red', 'blue'],
    [4, 0, 'red', 'blue'],
    [5, 0, 'red', 'blue'],
    [2, 1, 'red', 'blue'],
    [3, 1, 'yellow', 'green'],
    [4, 1, 'yellow', 'green'],
    [5, 1, 'yellow', 'green'],
    [6, 1, 'red', 'blue'],
    [1, 2, 'red', 'blue'],
    [2, 2, 'yellow', 'green'],
    [3, 2, 'green', 'yellow'],
    [4, 2, 'green', 'yellow'],
    [5, 2, 'green', 'yellow'],
    [6, 2, 'yellow', 'green'],
    [7, 2, 'red', 'blue'],
    [2, 3, 'blue', 'red'],
    [3, 3, 'green', 'yellow'],
    [4, 3, 'purple', 'purple'],
    [5, 3, 'green', 'yellow'],
    [6, 3, 'blue', 'red'],
    [2, 4, 'blue', 'red'],
    [3, 4, 'blue', 'red'],
    [4, 4, 'purple', 'purple'],
    [5, 4, 'blue', 'red'],
    [6, 4, 'blue', 'red'],
    [4, 5, 'blue', 'red'],
  ]),
  makeLevel(3, '第3关 茶杯', 300, [
    [2, 0, 'yellow', 'green'],
    [3, 0, 'yellow', 'green'],
    [4, 0, 'yellow', 'green'],
    [5, 0, 'yellow', 'green'],
    [6, 0, 'yellow', 'green'],
    [1, 1, 'blue', 'red'],
    [2, 1, 'blue', 'red'],
    [3, 1, 'green', 'yellow'],
    [4, 1, 'green', 'yellow'],
    [5, 1, 'green', 'yellow'],
    [6, 1, 'blue', 'red'],
    [7, 1, 'blue', 'red'],
    [1, 2, 'blue', 'red'],
    [2, 2, 'blue', 'red'],
    [3, 2, 'green', 'yellow'],
    [4, 2, 'purple', 'purple'],
    [5, 2, 'green', 'yellow'],
    [6, 2, 'blue', 'red'],
    [7, 2, 'blue', 'red'],
    [2, 3, 'blue', 'red'],
    [3, 3, 'blue', 'red'],
    [4, 3, 'blue', 'red'],
    [5, 3, 'blue', 'red'],
    [6, 3, 'blue', 'red'],
    [7, 3, 'red', 'blue'],
    [8, 3, 'red', 'blue'],
    [7, 4, 'red', 'blue'],
    [8, 4, 'red', 'blue'],
    [3, 5, 'purple', 'purple'],
    [6, 5, 'purple', 'purple'],
  ]),
  makeLevel(4, '第4关 台灯', 300, [
    [3, 0, 'yellow', 'green'],
    [4, 0, 'yellow', 'green'],
    [5, 0, 'yellow', 'green'],
    [2, 1, 'yellow', 'green'],
    [3, 1, 'red', 'blue'],
    [4, 1, 'red', 'blue'],
    [5, 1, 'red', 'blue'],
    [6, 1, 'yellow', 'green'],
    [2, 2, 'yellow', 'green'],
    [3, 2, 'red', 'blue'],
    [4, 2, 'red', 'blue'],
    [5, 2, 'red', 'blue'],
    [6, 2, 'yellow', 'green'],
    [3, 3, 'green', 'yellow'],
    [4, 3, 'green', 'yellow'],
    [5, 3, 'green', 'yellow'],
    [4, 4, 'green', 'yellow'],
    [3, 5, 'purple', 'purple'],
    [4, 5, 'purple', 'purple'],
    [5, 5, 'purple', 'purple'],
    [2, 6, 'blue', 'red'],
    [3, 6, 'blue', 'red'],
    [4, 6, 'blue', 'red'],
    [5, 6, 'blue', 'red'],
    [6, 6, 'blue', 'red'],
    [1, 7, 'blue', 'red'],
    [2, 7, 'blue', 'red'],
    [3, 7, 'purple', 'purple'],
    [4, 7, 'purple', 'purple'],
    [5, 7, 'purple', 'purple'],
    [6, 7, 'blue', 'red'],
    [7, 7, 'blue', 'red'],
    [3, 8, 'blue', 'red'],
    [5, 8, 'blue', 'red'],
  ]),
  makeLevel(5, '第5关 礼物相框', 300, [
    [1, 0, 'red', 'blue'],
    [2, 0, 'red', 'blue'],
    [3, 0, 'yellow', 'green'],
    [4, 0, 'yellow', 'green'],
    [5, 0, 'red', 'blue'],
    [6, 0, 'red', 'blue'],
    [1, 1, 'red', 'blue'],
    [2, 1, 'purple', 'purple'],
    [3, 1, 'yellow', 'green'],
    [4, 1, 'yellow', 'green'],
    [5, 1, 'purple', 'purple'],
    [6, 1, 'red', 'blue'],
    [0, 2, 'blue', 'red'],
    [1, 2, 'blue', 'red'],
    [2, 2, 'green', 'yellow'],
    [3, 2, 'green', 'yellow'],
    [4, 2, 'green', 'yellow'],
    [5, 2, 'green', 'yellow'],
    [6, 2, 'blue', 'red'],
    [7, 2, 'blue', 'red'],
    [0, 3, 'blue', 'red'],
    [1, 3, 'green', 'yellow'],
    [2, 3, 'purple', 'purple'],
    [3, 3, 'green', 'yellow'],
    [4, 3, 'green', 'yellow'],
    [5, 3, 'purple', 'purple'],
    [6, 3, 'green', 'yellow'],
    [7, 3, 'blue', 'red'],
    [1, 4, 'blue', 'red'],
    [2, 4, 'blue', 'red'],
    [3, 4, 'red', 'blue'],
    [4, 4, 'red', 'blue'],
    [5, 4, 'blue', 'red'],
    [6, 4, 'blue', 'red'],
    [2, 5, 'red', 'blue'],
    [3, 5, 'red', 'blue'],
    [4, 5, 'red', 'blue'],
    [5, 5, 'red', 'blue'],
  ]),
  makeLevel(6, '第6关 温馨客厅', 300, [
    [1, 0, 'yellow', 'green'],
    [2, 0, 'yellow', 'green'],
    [6, 0, 'red', 'blue'],
    [7, 0, 'red', 'blue'],
    [0, 1, 'yellow', 'green'],
    [1, 1, 'green', 'yellow'],
    [2, 1, 'green', 'yellow'],
    [3, 1, 'yellow', 'green'],
    [5, 1, 'red', 'blue'],
    [6, 1, 'purple', 'purple'],
    [7, 1, 'purple', 'purple'],
    [8, 1, 'red', 'blue'],
    [0, 2, 'blue', 'red'],
    [1, 2, 'green', 'yellow'],
    [2, 2, 'purple', 'purple'],
    [3, 2, 'green', 'yellow'],
    [5, 2, 'blue', 'red'],
    [6, 2, 'red', 'blue'],
    [7, 2, 'red', 'blue'],
    [8, 2, 'blue', 'red'],
    [1, 3, 'blue', 'red'],
    [2, 3, 'blue', 'red'],
    [6, 3, 'blue', 'red'],
    [7, 3, 'blue', 'red'],
    [0, 4, 'red', 'blue'],
    [1, 4, 'red', 'blue'],
    [2, 4, 'green', 'yellow'],
    [3, 4, 'green', 'yellow'],
    [4, 4, 'green', 'yellow'],
    [5, 4, 'green', 'yellow'],
    [6, 4, 'red', 'blue'],
    [7, 4, 'red', 'blue'],
    [8, 4, 'red', 'blue'],
    [1, 5, 'red', 'blue'],
    [2, 5, 'purple', 'purple'],
    [3, 5, 'blue', 'red'],
    [4, 5, 'blue', 'red'],
    [5, 5, 'blue', 'red'],
    [6, 5, 'purple', 'purple'],
    [7, 5, 'red', 'blue'],
    [2, 6, 'yellow', 'green'],
    [6, 6, 'yellow', 'green'],
  ]),
]
```

- [ ] **Step 2: Run level tests**

Run: `npm test -- src/levels.test.ts`

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit implementation**

```bash
git add src/levels.ts src/levels.test.ts
git commit -m "Optimize level difficulty progression"
```
