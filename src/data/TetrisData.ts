/**
 * Tetris Game Static Data & Constants
 */

export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 20;

export const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-arcade-blue' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-arcade-purple' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-arcade-yellow' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-arcade-pink' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-arcade-green' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-arcade-blue' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-arcade-pink' },
};
