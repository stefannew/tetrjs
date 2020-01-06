import { Render, Engine } from 'matter-js';

import {
  BACKGROUND_COLOR,
  CONTEXT_SCALE_RATIO,
  IMAGES,
  LABEL,
  BLOCK_SIZE
} from '../constants';

export default class Renderer {
  renderer: Render;
  context: CanvasRenderingContext2D;
  images: {
    [key: string]: CanvasImageSource;
  };
  nextPieceContext: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(width: number, height: number, engine: Engine) {
    this.width = width;
    this.height = height;
    this.nextPieceContext = (document.querySelector(
      '#next-piece'
    ) as HTMLCanvasElement).getContext('2d');
    this.nextPieceContext.fillStyle = BACKGROUND_COLOR;
    this.nextPieceContext.imageSmoothingEnabled = false;

    const canvas = document.createElement('canvas');
    document.querySelector('#canvas-container').appendChild(canvas);
    canvas.height = this.height * CONTEXT_SCALE_RATIO;
    canvas.width = this.width * CONTEXT_SCALE_RATIO;
    this.context = canvas.getContext('2d');
    this.context.scale(CONTEXT_SCALE_RATIO, CONTEXT_SCALE_RATIO);
    this.context.imageSmoothingEnabled = false;

    this.init();
  }

  private init() {
    this.images = {};
    // Preload images
  }

  public render(nextPiece: Matter.Body, bodies: Array<Matter.Body>) {
    this.drawNext(nextPiece);
    this.drawAllBodies(bodies);
  }

  private drawNext(nextPiece: Matter.Body) {
    this.nextPieceContext.fillRect(5, 5, 100, 100);
    this.nextPieceContext.beginPath();

    const parts = nextPiece.parts.slice(1); // Removing the reference to self

    parts.forEach(part => {
      // @ts-ignore
      const { name, vertices } = part;
      const vertex = vertices[0];

      this.nextPieceContext.drawImage(
        this.getTexture(name),
        vertex.x / 4 - 47,
        name === 'I' ? vertex.y / 4 + 60 : vertex.y / 4 + 50,
        21,
        21
      );
    });
  }

  private drawAllBodies(bodies: Array<Matter.Body>) {
    this.context.fillStyle = BACKGROUND_COLOR;
    this.context.fillRect(0, 0, this.width, this.height);
    bodies
      .filter(body => body.label === LABEL.TETRONIMO)
      .forEach(body => {
        for (
          let k = body.parts.length > 1 ? 1 : 0;
          k < body.parts.length;
          k++
        ) {
          const part = body.parts[k];
          this.context.translate(part.position.x, part.position.y);
          this.context.rotate(body.angle);
          // @ts-ignore
          const texture = this.getTexture(part.name);
          this.context.drawImage(
            texture,
            // @ts-ignore
            BLOCK_SIZE - BLOCK_SIZE - BLOCK_SIZE / 2,
            BLOCK_SIZE - BLOCK_SIZE - BLOCK_SIZE / 2,
            BLOCK_SIZE,
            BLOCK_SIZE
          );

          this.context.rotate(-body.angle);
          this.context.translate(-part.position.x, -part.position.y);
        }
      });
  }

  private getTexture(name: string) {
    let image = this.images[name];
    if (image) {
      return image;
    }

    image = this.images[name] = new Image();
    // @ts-ignore
    image.src = `${IMAGES[name].default}`;

    return image;
  }
}
