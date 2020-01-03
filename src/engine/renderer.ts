import { Render, Engine } from 'matter-js';

import { IMAGES, LABEL } from '../constants';

export default class Renderer {
  renderer: Render;
  images: {
    [key: string]: CanvasImageSource;
  };
  nextPieceContext: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(width: number, height: number, engine: Engine) {
    this.nextPieceContext = (document.querySelector(
      '#next-piece'
    ) as HTMLCanvasElement).getContext('2d');
    this.nextPieceContext.imageSmoothingEnabled = false; /// future
    this.images = {};

    this.renderer = Render.create({
      element: document.querySelector('#canvas-container'),
      engine,
      options: {
        background: 'white',
        height,
        width,
        wireframes: false
      }
    });

    let imageCount = 0;

    Object.keys(IMAGES).forEach(tetronimoName => {
      const image = new Image();
      // @ts-ignore
      image.src = `${IMAGES[tetronimoName].default}`;

      image.onload = function() {
        imageCount += 1;
        this.images[tetronimoName] = image;

        if (imageCount === Object.keys(IMAGES).length) {
          Render.run(this.renderer);
        }
      }.bind(this);
    });
  }

  public render(nextPiece: Matter.Body) {
    this.nextPieceContext.fillStyle = '#fff';
    this.nextPieceContext.fillRect(5, 5, 100, 100);
    this.nextPieceContext.beginPath();

    const parts = nextPiece.parts.slice(1);

    parts.forEach(part => {
      // @ts-ignore
      const { name, vertices } = part;
      const vertex = vertices[0];

      this.nextPieceContext.drawImage(
        this.images[name],
        vertex.x - 45,
        vertex.y + 80,
        21,
        21
      );
    });
  }
}
