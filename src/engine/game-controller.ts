import * as PolyK from 'polyk';
// @ts-ignore
import decomp from 'poly-decomp';
// @ts-ignore
window.decomp = decomp;

import {
  Body,
  Bodies,
  Composite,
  Engine as MEngine,
  Events,
  Query,
  Vertices,
  World,
  Vector
} from 'matter-js';

import {
  BLOCK_SIZE,
  BLOCKS,
  GameState,
  GAME_HEIGHT,
  GAME_WIDTH,
  IMAGES,
  KEY_CODE,
  LABEL,
  STARTING_POSITION_X,
  STARTING_POSITION_Y
} from '../constants';
import Engine from './engine';
import { getRandomTetronimoName } from 'utils';

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
  px: number,
  py: number,
  name: string
) =>
  Bodies.rectangle(x + px, y + py, BLOCK_SIZE, BLOCK_SIZE, {
    label: LABEL.BLOCK,
    // @ts-ignore
    name,
    isSleeping: true
  });

export default class GameController {
  currentPiece: Body = null;
  currentState: GameState;
  hasInstantiated: boolean = false;
  engine: MEngine;
  lines: number = 0;
  nextPiece: Body = null;
  world: World;

  constructor(engine: Engine) {
    this.world = engine.getWorld();
    this.engine = engine.getInstance();
    this.instantiateTetronimo();

    window.addEventListener('keydown', this.keyDown.bind(this));
    World.add(this.world, createContainer());
    Events.on(this.engine, 'collisionStart', this.onCollisionStart.bind(this));
    Events.on(this.engine, 'afterTick', this.afterTick.bind(this));
  }

  private afterTick() {
    this.checkRows();
    this.checkGameOver();

    // Draw Line Counter to Screen
    document.querySelector('#lines .value').textContent = this.lines.toString();
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

  private checkGameOver() {
    // @ts-ignore
    if (!this.currentPiece.alive && this.currentPiece.position.y < 0) {
      this.setCurrentState(GameState.GAME_OVER);
    }
  }

  private killTetronimo(tetronimo: Body) {
    // @ts-ignore
    tetronimo.parent.alive = false;
    tetronimo.parent.mass = 100;
  }

  private incrementLineCount() {
    this.lines++;
  }

  private checkRows() {
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
        y: y
      };

      const collisions = Query.region(tetronimos, {
        min: {
          x: start.x,
          y: start.y + 2
        },
        max: {
          x: end.x,
          y: end.y + BLOCK_SIZE - 2
        }
      });

      if (collisions.length >= 10) {
        this.drawRowDeletion(start, end);
        this.incrementLineCount();

        let toBeSliced = [];
        let toBeCreated: Array<PolyK.Polygon> = [];

        for (let i = 0; i < collisions.length; i++) {
          let vertices = collisions[i].parts[0].vertices;
          let pointsArray: Array<number> = [];
          vertices.forEach((vertex: Matter.Vector) => {
            pointsArray.push(vertex.x, vertex.y);
          });

          let slicedPolys = PolyK.Slice(
            pointsArray,
            start.x,
            start.y,
            end.x,
            end.y
          );
          if (slicedPolys.length > 1) {
            toBeSliced.push(collisions[i]);
            slicedPolys.forEach(points => {
              toBeCreated.push(points);
            });
          }

          // @ts-ignore
          if (collisions[i].parent.alive && !this.hasInstantiated) {
            this.instantiateTetronimo();
            this.hasInstantiated = true;
          }

          World.remove(this.world, collisions[i].parent);
        }

        toBeSliced.forEach((body: Body) => {
          World.remove(this.world, body);
        });

        toBeCreated.forEach(points => {
          let poly = [];
          for (let i = 0; i < points.length / 2; i++) {
            poly.push({
              // @ts-ignore
              x: points[i * 2],
              y: points[i * 2 + 1]
            });
          }

          let sliceCenter = Vertices.centre(poly);
          const body = Bodies.fromVertices(sliceCenter.x, sliceCenter.y, poly, {
            alive: false,
            label: LABEL.TETRONIMO,
            render: {}
          });

          World.add(this.world, body);
        });

        for (let i = 0; i < collisions.length; i++) {
          World.remove(this.world, collisions[i]);
        }
      }
    }
  }

  private drawRowDeletion(start: Vector, end: Vector) {
    const context = document.querySelector('canvas').getContext('2d');
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.strokeStyle = 'grey';
    context.lineWidth = BLOCK_SIZE;
    context.stroke();
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

  private createRandomTetronimo() {
    const tetronimoName = getRandomTetronimoName();
    const vertices = BLOCKS[tetronimoName];

    return Body.create({
      // @ts-ignore
      alive: true,
      label: LABEL.TETRONIMO,
      parts: vertices.map((vertex: Array<number>) =>
        createBlock(
          vertex,
          STARTING_POSITION_X[tetronimoName],
          STARTING_POSITION_Y,
          tetronimoName
        )
      )
    });
  }

  private instantiateTetronimo() {
    this.currentPiece =
      this.nextPiece === null ? this.createRandomTetronimo() : this.nextPiece;
    this.nextPiece = this.createRandomTetronimo();
    World.add(this.world, this.currentPiece);
    this.hasInstantiated = false;
  }

  private drawTitle() {}

  private drawPause() {}

  public setCurrentState(nextState: GameState) {
    this.currentState = nextState;
  }

  public getNextPiece() {
    return this.nextPiece;
  }
}
