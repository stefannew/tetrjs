export const BLOCK_SIZE = 20;
export const GAME_HEIGHT = 20 * BLOCK_SIZE;
export const GAME_WIDTH = 10 * BLOCK_SIZE;
export const GRAVITY = 9.82;

export enum GameState {
  TITLE,
  PLAYING,
  PAUSED,
  GAME_OVER,
  SETTINGS
}

export const KEY_CODE = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
};

export const TETRONIMO_NAMES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export const COLORS: {
  [key: string]: string;
} = {
  I: 'cyan',
  J: 'blue',
  L: 'orange',
  O: 'yellow',
  S: 'green',
  T: 'purple',
  Z: 'red'
};

export const LABEL = {
  GROUND: 'GROUND',
  WALL_LEFT: 'WALL_LEFT',
  WALL_RIGHT: 'WALL_RIGHT',
  TETRONIMO: 'TETRONIMO',
  BLOCK: 'BLOCK'
};

export const BLOCKS: {
  [key: string]: Array<Array<number>>;
} = {
  I: [
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE * 2, 0],
    [BLOCK_SIZE * 3, 0],
    [BLOCK_SIZE * 4, 0]
  ],
  J: [
    [0, 0],
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE * 2, 0],
    [BLOCK_SIZE * 2, BLOCK_SIZE]
  ],
  L: [
    [BLOCK_SIZE, BLOCK_SIZE],
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE * 2, 0],
    [BLOCK_SIZE * 3, 0]
  ],
  O: [
    [0, 0],
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE, BLOCK_SIZE],
    [0, BLOCK_SIZE]
  ],
  S: [
    [0, BLOCK_SIZE],
    [BLOCK_SIZE, BLOCK_SIZE],
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE * 2, 0]
  ],
  T: [
    [0, 0],
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE * 2, 0],
    [BLOCK_SIZE, BLOCK_SIZE]
  ],
  Z: [
    [0, 0],
    [BLOCK_SIZE, 0],
    [BLOCK_SIZE, BLOCK_SIZE],
    [BLOCK_SIZE * 2, BLOCK_SIZE]
  ]
};

export const STARTING_POSITION_Y = -40;

export const STARTING_POSITION_X: {
  [key: string]: number;
} = {
  I: GAME_WIDTH / 2 - BLOCK_SIZE * 2 - BLOCK_SIZE / 2,
  J: GAME_WIDTH / 2 - BLOCK_SIZE,
  L: GAME_WIDTH / 2 - BLOCK_SIZE * 2,
  O: GAME_WIDTH / 2 - BLOCK_SIZE / 2,
  S: GAME_WIDTH / 2 - BLOCK_SIZE,
  T: GAME_WIDTH / 2 - BLOCK_SIZE,
  Z: GAME_WIDTH / 2 - BLOCK_SIZE
};
