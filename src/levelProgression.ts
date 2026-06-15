export type CompletionProgress =
  | {
      status: 'won'
      nextLevelIndex: number
      isFinalLevel: false
    }
  | {
      status: 'completed'
      nextLevelIndex: null
      isFinalLevel: true
    }

export function getCompletionProgress(levelIndex: number, levelCount: number): CompletionProgress {
  if (levelCount <= 0) {
    throw new Error('Cannot progress without levels')
  }

  const isFinalLevel = levelIndex >= levelCount - 1
  if (isFinalLevel) {
    return {
      status: 'completed',
      nextLevelIndex: null,
      isFinalLevel: true,
    }
  }

  return {
    status: 'won',
    nextLevelIndex: levelIndex + 1,
    isFinalLevel: false,
  }
}
