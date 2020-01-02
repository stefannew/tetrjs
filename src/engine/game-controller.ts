import {
  Body,
  Bodies,
  Composite,
  Engine as MEngine,
  Events,
  Query,
  World
} from 'matter-js';

import {
  GAME_HEIGHT,
  GAME_WIDTH,
  BLOCK_SIZE,
  LABEL,
  BLOCKS,
  COLORS,
  STARTING_POSITION_X,
  STARTING_POSITION_Y,
  KEY_CODE,
  GameState
} from '../constants';
import Engine from './engine';
import { getRandomTetronimoName, degreesToRadians } from 'utils';

const createContainer = () => {
  const ground = Bodies.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT + 30,
    GAME_WIDTH + 20,
    60,
    {
      isSleeping: true,
      isStatic: true,
      label: LABEL.GROUND,
      render: {
        strokeStyle: 'black',
        lineWidth: 1
      }
    }
  );

  const wallLeft = Bodies.rectangle(-30, GAME_HEIGHT / 2, 60, GAME_HEIGHT, {
    isSleeping: true,
    isStatic: true,
    label: LABEL.WALL_LEFT,
    render: {
      strokeStyle: 'black',
      lineWidth: 1
    }
  });

  const wallRight = Bodies.rectangle(
    GAME_WIDTH + 30,
    GAME_HEIGHT / 2,
    60,
    GAME_HEIGHT,
    {
      isSleeping: true,
      isStatic: true,
      label: LABEL.WALL_RIGHT,
      render: {
        strokeStyle: 'black',
        lineWidth: 1
      }
    }
  );

  return [ground, wallLeft, wallRight];
};

const createBlock = (
  [x, y]: Array<number>,
  color: string,
  px: number,
  py: number
) =>
  Bodies.rectangle(x + px, y + py, BLOCK_SIZE, BLOCK_SIZE, {
    label: LABEL.BLOCK,
    render: {
      fillStyle: color,
      lineWidth: 1.5
    }
  });

export default class GameController {
  currentPiece: Body;
  engine: MEngine;
  world: World;
  currentState: GameState;

  constructor(engine: Engine) {
    this.world = engine.getWorld();
    this.engine = engine.getInstance();
    this.instantiateTetronimo();

    window.addEventListener('keydown', this.keyDown.bind(this));
    World.add(this.world, createContainer());
    Events.on(this.engine, 'collisionStart', this.onCollisionStart.bind(this));
    Events.on(this.engine, 'afterTick', this.checkRows.bind(this));
    Events.on(this.engine, 'beforeUpdate', this.checkGameOver);
  }

  private keyDown({ keyCode }: KeyboardEvent) {
    switch (keyCode) {
      case KEY_CODE.DOWN:
        this.currentPiece.position.y += 1;
        break;
      case KEY_CODE.UP:
        Body.rotate(this.currentPiece, Math.PI / 2);
        break;
      case KEY_CODE.LEFT:
        this.currentPiece.position.x -= 1;
        break;
      case KEY_CODE.RIGHT:
        this.currentPiece.position.x += 1;
        break;
    }
  }

  private killTetronimo(tetronimo: Body) {
    // @ts-ignore
    tetronimo.parent.alive = false;
    tetronimo.parent.mass = 100;
  }

  private checkRows() {
    const context = document.querySelector('canvas').getContext('2d');
    const rayWidth = 0.1;
    const tetronimos = Composite.allBodies(this.world)
      // @ts-ignore
      .flatMap(body => body.parts)
      .filter((body: Body) => body.label === LABEL.BLOCK);

    for (let y = 0; y < GAME_HEIGHT; y += BLOCK_SIZE) {
      const start = {
        x: 0,
        y
      };

      const end = {
        x: GAME_WIDTH,
        y
      };

      const collisions = Query.ray(tetronimos, start, end, rayWidth);

      if (collisions.length >= 10) {
        const blocks = collisions.map(collision => collision.body);
        const parents = blocks.map(block => block.parent);

        parents.forEach((parent: Body) => {
          blocks.forEach((block: Body) => {
            const index = parent.parts.findIndex(b => b.id === block.id);
            if (index > -1) {
              parent.parts.splice(index, 1);
            }
          });
        });
      }
    }
  }

  private checkGameOver() {
    const tetronimos = Composite.allBodies(this.world).filter(
      body => body.label === LABEL.TETRONIMO
    );

    tetronimos.forEach(tetronimo => {
      // @ts-ignore
      if (tetronimo.position.y < 0 && !tetronimo.alive) {
      }
    });
  }

  private onCollisionStart({ pairs }: Matter.IEventCollision<Body>) {
    for (let i = 0; i < pairs.length; i++) {
      const { bodyA, bodyB } = pairs[i];

      if (
        bodyA.label === LABEL.GROUND &&
        // @ts-ignore
        bodyB.parent.alive
      ) {
        this.killTetronimo(bodyB);
        this.instantiateTetronimo();
        return;
      }

      if (
        bodyB.label === LABEL.GROUND &&
        // @ts-ignore
        bodyA.parent.alive
      ) {
        this.killTetronimo(bodyA);
        this.instantiateTetronimo();
        return;
      }

      if (
        bodyA.parent.label === LABEL.TETRONIMO &&
        bodyB.parent.label === LABEL.TETRONIMO &&
        // @ts-ignore
        !bodyA.parent.alive &&
        // @ts-ignore
        bodyB.parent.alive
      ) {
        this.killTetronimo(bodyB);
        this.instantiateTetronimo();
        return;
      }

      if (
        bodyA.parent.label === LABEL.TETRONIMO &&
        bodyB.parent.label === LABEL.TETRONIMO &&
        // @ts-ignore
        bodyA.parent.alive &&
        // @ts-ignore
        !bodyB.parent.alive
      ) {
        this.killTetronimo(bodyA);
        this.instantiateTetronimo();
        return;
      }
    }
  }

  private instantiateTetronimo() {
    const tetronimoName = getRandomTetronimoName();
    const vertices = BLOCKS[tetronimoName];
    const color = COLORS[tetronimoName];

    this.currentPiece = Body.create({
      // @ts-ignore
      alive: true,
      label: LABEL.TETRONIMO,
      parts: vertices.map((vertex: Array<number>) =>
        createBlock(
          vertex,
          color,
          STARTING_POSITION_X[tetronimoName],
          STARTING_POSITION_Y
        )
      )
    });

    World.add(this.world, this.currentPiece);
  }
}
