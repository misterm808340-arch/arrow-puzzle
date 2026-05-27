import { ArrowData, Direction, LevelData } from './types';

/**
 * Check if an arrow can be validly removed.
 * An arrow is valid if every cell in front of it (in its direction) until the grid edge is empty.
 */
export function isValidRemoval(
  grid: (ArrowData | null)[][],
  arrow: ArrowData
): boolean {
  const { row, col, direction } = arrow;
  const size = grid.length;

  switch (direction) {
    case 'UP': {
      for (let r = row - 1; r >= 0; r--) {
        if (grid[r][col] !== null) return false;
      }
      return true;
    }
    case 'DOWN': {
      for (let r = row + 1; r < size; r++) {
        if (grid[r][col] !== null) return false;
      }
      return true;
    }
    case 'LEFT': {
      for (let c = col - 1; c >= 0; c--) {
        if (grid[row][c] !== null) return false;
      }
      return true;
    }
    case 'RIGHT': {
      for (let c = col + 1; c < size; c++) {
        if (grid[row][c] !== null) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

/**
 * Get all arrows that can currently be validly removed.
 */
export function getValidArrows(grid: (ArrowData | null)[][]): ArrowData[] {
  const valid: ArrowData[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const arrow = grid[r][c];
      if (arrow && isValidRemoval(grid, arrow)) {
        valid.push(arrow);
      }
    }
  }
  return valid;
}

/**
 * Remove an arrow from the grid (returns new grid).
 */
export function removeArrow(
  grid: (ArrowData | null)[][],
  arrow: ArrowData
): (ArrowData | null)[][] {
  const newGrid = grid.map(row => [...row]);
  newGrid[arrow.row][arrow.col] = null;
  return newGrid;
}

/**
 * Create a grid from level data.
 */
export function createGridFromLevel(level: LevelData): (ArrowData | null)[][] {
  const grid: (ArrowData | null)[][] = Array.from(
    { length: level.grid_size },
    () => Array(level.grid_size).fill(null)
  );

  for (const arrow of level.arrows) {
    const id = `${arrow.row}-${arrow.col}-${arrow.direction}`;
    grid[arrow.row][arrow.col] = {
      row: arrow.row,
      col: arrow.col,
      direction: arrow.direction,
      id,
    };
  }

  return grid;
}

/**
 * Get the exit position for an arrow animation.
 * Returns the offset from the arrow's cell position.
 */
export function getArrowExitOffset(
  direction: Direction,
  gridSize: number,
  cellSize: number
): { x: number; y: number } {
  const totalDistance = gridSize * cellSize + cellSize;
  switch (direction) {
    case 'UP':
      return { x: 0, y: -totalDistance };
    case 'DOWN':
      return { x: 0, y: totalDistance };
    case 'LEFT':
      return { x: -totalDistance, y: 0 };
    case 'RIGHT':
      return { x: totalDistance, y: 0 };
  }
}

/**
 * Seeded random number generator for deterministic level generation.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

/**
 * Generate a solvable level using backward placement algorithm.
 * We place arrows in reverse removal order: the last arrow to be removed is placed first.
 * Each arrow must have its path clear of already-placed arrows (which are removed later).
 */
export function generateLevel(levelNum: number): LevelData {
  const rng = new SeededRandom(levelNum * 7919 + 42);

  // Determine grid size and arrow count based on level
  let gridSize: number;
  let arrowCount: number;

  if (levelNum <= 5) {
    gridSize = 3;
    arrowCount = Math.min(3 + levelNum, 7);
  } else if (levelNum <= 12) {
    gridSize = 4;
    arrowCount = Math.min(5 + Math.floor((levelNum - 5) * 0.7), 12);
  } else if (levelNum <= 20) {
    gridSize = 5;
    arrowCount = Math.min(8 + Math.floor((levelNum - 12) * 0.6), 18);
  } else if (levelNum <= 50) {
    gridSize = 5;
    arrowCount = Math.min(12 + Math.floor((levelNum - 20) * 0.2), 20);
  } else if (levelNum <= 100) {
    gridSize = 6;
    arrowCount = Math.min(14 + Math.floor((levelNum - 50) * 0.1), 28);
  } else if (levelNum <= 500) {
    gridSize = 6;
    arrowCount = Math.min(18 + Math.floor((levelNum - 100) * 0.02), 32);
  } else {
    gridSize = 7;
    arrowCount = Math.min(22 + Math.floor((levelNum - 500) * 0.01), 40);
  }

  // Harder levels: increase density
  if (levelNum > 1000) {
    arrowCount = Math.min(arrowCount + 5, 45);
  }
  if (levelNum > 1500) {
    arrowCount = Math.min(arrowCount + 8, 48);
  }

  arrowCount = Math.min(arrowCount, gridSize * gridSize - 1);

  // Generate solvable level using backward placement
  const arrows: { row: number; col: number; direction: Direction }[] = [];
  const occupied = new Set<string>();

  // Build grid to track placements
  const grid: (number | null)[][] = Array.from(
    { length: gridSize },
    () => Array(gridSize).fill(null)
  );

  let attempts = 0;
  const maxAttempts = 1000;

  // Place arrows from last to first (reverse removal order)
  for (let i = arrowCount - 1; i >= 0 && attempts < maxAttempts; ) {
    attempts++;
    const row = rng.nextInt(0, gridSize - 1);
    const col = rng.nextInt(0, gridSize - 1);
    const key = `${row},${col}`;

    if (occupied.has(key)) continue;

    const direction = rng.pick(DIRECTIONS);

    // Check if this arrow's path is clear of already-placed arrows
    // (already-placed arrows are removed LATER, so they're on the grid when this one is removed)
    let pathClear = true;
    switch (direction) {
      case 'UP':
        for (let r = row - 1; r >= 0; r--) {
          if (grid[r][col] !== null) { pathClear = false; break; }
        }
        break;
      case 'DOWN':
        for (let r = row + 1; r < gridSize; r++) {
          if (grid[r][col] !== null) { pathClear = false; break; }
        }
        break;
      case 'LEFT':
        for (let c = col - 1; c >= 0; c--) {
          if (grid[row][c] !== null) { pathClear = false; break; }
        }
        break;
      case 'RIGHT':
        for (let c = col + 1; c < gridSize; c++) {
          if (grid[row][c] !== null) { pathClear = false; break; }
        }
        break;
    }

    if (pathClear) {
      occupied.add(key);
      grid[row][col] = i;
      arrows.push({ row, col, direction });
      i--;
      attempts = 0;
    }
  }

  // If we couldn't place all arrows, fill remaining with edge arrows
  while (arrows.length < arrowCount) {
    const edgePositions: { row: number; col: number }[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!occupied.has(`${r},${c}`)) {
          // Prefer edge positions for easier placement
          if (r === 0 || r === gridSize - 1 || c === 0 || c === gridSize - 1) {
            edgePositions.push({ row: r, col: c });
          }
        }
      }
    }
    if (edgePositions.length === 0) break;

    const pos = rng.pick(edgePositions);
    const key = `${pos.row},${pos.col}`;
    if (occupied.has(key)) continue;

    // Find a direction that works
    const shuffledDirs = rng.shuffle([...DIRECTIONS]);
    for (const dir of shuffledDirs) {
      let pathClear = true;
      switch (dir) {
        case 'UP':
          for (let r = pos.row - 1; r >= 0; r--) {
            if (grid[r][pos.col] !== null) { pathClear = false; break; }
          }
          break;
        case 'DOWN':
          for (let r = pos.row + 1; r < gridSize; r++) {
            if (grid[r][pos.col] !== null) { pathClear = false; break; }
          }
          break;
        case 'LEFT':
          for (let c = pos.col - 1; c >= 0; c--) {
            if (grid[pos.row][c] !== null) { pathClear = false; break; }
          }
          break;
        case 'RIGHT':
          for (let c = pos.col + 1; c < gridSize; c++) {
            if (grid[pos.row][c] !== null) { pathClear = false; break; }
          }
          break;
      }
      if (pathClear) {
        occupied.add(key);
        grid[pos.row][pos.col] = arrows.length;
        arrows.push({ row: pos.row, col: pos.col, direction: dir });
        break;
      }
    }
  }

  return {
    level: levelNum,
    grid_size: gridSize,
    arrows,
  };
}

/**
 * Generate daily challenge level based on date.
 */
export function generateDailyChallenge(): LevelData {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rng = new SeededRandom(seed);

  const gridSize = 5;
  const arrowCount = rng.nextInt(12, 18);

  // Use the same generation algorithm
  const level = generateLevel(seed);
  level.level = -1; // Special marker for daily
  return level;
}
