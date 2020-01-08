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
  Bounds
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
  STARTING_POSITION_Y,
  GRAVITY
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
  name: string,
  image: string
) =>
  Bodies.rectangle(x + px, y + py, BLOCK_SIZE, BLOCK_SIZE, {
    label: LABEL.BLOCK,
    render: {
      sprite: {
        texture: image,
        xScale: 12,
        yScale: 12
      }
    },
    // @ts-ignore
    name,
    isSleeping: true
  });

export default class GameController {
  private currentPiece: Body = null;
  private currentState: GameState = GameState.PLAYING;
  private engine: MEngine;
  private ground: Body;
  private hasInstantiated: boolean = false;
  private level: number = 0;
  private lines: number = 0;
  private nextPiece: Body = null;
  private score: number = 0;
  private rowDeletionBounds: Array<Bounds> = [];
  private world: World;

  constructor(engine: Engine) {
    this.world = engine.getWorld();
    this.engine = engine.getInstance();
    this.init();
  }

  private init() {
    document.querySelector('#lines .value').textContent = this.lines.toString();
    (document.querySelector(
      '#game-over-text'
    ) as HTMLDivElement).style.visibility = 'hidden';
    this.setCurrentState(GameState.PLAYING);
    this.world.gravity.y = GRAVITY;
    this.lines = 0;
    this.level = 0;
    this.score = 0;
    Composite.allBodies(this.world).forEach(body => {
      World.remove(this.world, body);
    });

    this.instantiateTetronimo();
    const [ground, left, right] = createContainer();
    this.ground = ground;

    window.addEventListener('keydown', this.keyDown.bind(this));
    World.add(this.world, [this.ground, left, right]);
    Events.on(this.engine, 'collisionStart', this.onCollisionStart.bind(this));
    Events.on(this.engine, 'afterTick', this.afterTick.bind(this));
  }

  private setGravitySpeedModifier() {
    if (this.level !== 0 && this.level % 10 === 0) {
      this.world.gravity.y += GRAVITY;
    }
  }

  private afterTick() {
    this.checkRows();
    this.setGravitySpeedModifier();

    /**
     * This should all probably be in the renderer, but I'm getting bored now
     */
    document.querySelector('#lines .value').textContent = this.lines.toString();
    document.querySelector('#level .value').textContent = this.level.toString();
    document.querySelector('#score .value').textContent = this.score.toString();
  }

  private keyDown({ keyCode }: KeyboardEvent) {
    switch (keyCode) {
      case KEY_CODE.ENTER:
        if (this.currentState === GameState.GAME_OVER) {
          this.init();
        }
        break;
      case KEY_CODE.ESCAPE:
        this.togglePaused();
        break;
      case KEY_CODE.DOWN:
        if (
          this.currentState === GameState.GAME_OVER ||
          this.currentState === GameState.PAUSED
        )
          return;
        this.currentPiece.position.y += 2;
        break;
      case KEY_CODE.UP:
        if (
          this.currentState === GameState.GAME_OVER ||
          this.currentState === GameState.PAUSED
        )
          return;
        Body.rotate(this.currentPiece, Math.PI / 2);
        break;
      case KEY_CODE.LEFT:
        if (
          this.currentState === GameState.GAME_OVER ||
          this.currentState === GameState.PAUSED
        )
          return;
        this.currentPiece.position.x -= 2;
        break;
      case KEY_CODE.RIGHT:
        if (
          this.currentState === GameState.GAME_OVER ||
          this.currentState === GameState.PAUSED
        )
          return;
        this.currentPiece.position.x += 2;
        break;
    }
  }

  private gameOver() {
    this.setCurrentState(GameState.GAME_OVER);
    (document.querySelector(
      '#game-over-text'
    ) as HTMLDivElement).style.visibility = 'visible';
    this.world.gravity.y = GRAVITY * 8;
    Events.off(this.engine, 'collisionStart', this.onCollisionStart.bind(this));
    World.remove(this.world, this.ground);
  }

  private killTetronimo(block: Body) {
    // @ts-ignore
    block.parent.alive = false;
    block.parent.density = 1;
    block.parent.mass = 1;
  }

  private incrementLevelCount() {
    this.level++;
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
          y: start.y
        },
        max: {
          x: end.x,
          y: end.y
        }
      });

      if (collisions.length >= 10) {
        this.rowDeletionBounds.push({
          min: {
            x: start.x,
            y: start.y
          },
          max: {
            x: end.x,
            y: end.y
          }
        });

        this.incrementLineCount();

        if (this.lines !== 0 && this.lines % 10 == 0) {
          this.incrementLevelCount();
        }

        let toBeSliced = [];
        let toBeCreated: Array<{
          points: PolyK.Polygon;
          name: string;
        }> = [];

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
              toBeCreated.push({
                // @ts-ignore
                points,
                // @ts-ignore
                name: collisions[i].name
              });
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

        toBeCreated.forEach(({ points, name }) => {
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
            isPiece: true,
            name
          });

          World.add(this.world, body);
        });

        for (let i = 0; i < collisions.length; i++) {
          World.remove(this.world, collisions[i]);
        }
      }
    }
  }

  private onCollisionStart({ pairs }: Matter.IEventCollision<Body>) {
    for (let i = 0; i < pairs.length; i++) {
      const { bodyA, bodyB } = pairs[i];

      if (bodyA.position.y <= -25 || bodyB.position.y <= -25) {
        this.gameOver();
      }

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
    // @ts-ignore
    const image = `${IMAGES[tetronimoName].default}`;

    return Body.create({
      // @ts-ignore
      alive: true,
      name: tetronimoName,
      label: LABEL.TETRONIMO,
      parts: vertices.map((vertex: Array<number>) =>
        createBlock(
          vertex,
          STARTING_POSITION_X[tetronimoName],
          STARTING_POSITION_Y,
          tetronimoName,
          image
        )
      )
    });
  }

  private instantiateTetronimo() {
    if (this.currentState !== GameState.PLAYING) return;

    this.currentPiece =
      this.nextPiece === null ? this.createRandomTetronimo() : this.nextPiece;
    this.nextPiece = this.createRandomTetronimo();
    World.add(this.world, this.currentPiece);
    this.hasInstantiated = false;
  }

  /**
   * In renderer?
   * The renderer has no knowledge of the GameState
   */
  private drawTitle() {}

  private togglePaused() {
    if (this.currentState === GameState.PAUSED) {
      this.world.gravity.y = GRAVITY;
      this.currentPiece.isStatic = false;
      // @ts-ignore
      document.querySelector('#paused-text').style.visibility = 'hidden';
      this.setCurrentState(GameState.PLAYING);
      return;
    }

    this.setCurrentState(GameState.PAUSED);
    this.currentPiece.isStatic = true;
    // @ts-ignore
    document.querySelector('#paused-text').style.visibility = 'visible';
  }

  public setCurrentState(nextState: GameState) {
    this.currentState = nextState;
  }

  public getCurrentState() {
    return this.currentState;
  }

  public getNextPiece() {
    return this.nextPiece;
  }

  public getBodies() {
    return Composite.allBodies(this.world);
  }

  public getRowDeletionBounds() {
    return this.rowDeletionBounds;
  }
}
