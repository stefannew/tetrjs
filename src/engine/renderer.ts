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
    this.nextPieceContext.imageSmoothingEnabled = false;
    this.renderer = Render.create({
      element: document.querySelector('#canvas-container'),
      engine,
      options: {
        background: 'white',
        height: height / 4,
        width: width / 4,
        wireframes: false
      }
    });
    this.renderer.context.scale(0.25, 0.25);

    this.init();
  }

  private init() {
    this.images = {};
    const imageKeys = Object.keys(IMAGES);
    const totalImageCount = imageKeys.length;
    let imageCount = 0;

    imageKeys.forEach(tetronimoName => {
      const image = new Image();
      // @ts-ignore
      image.src = `${IMAGES[tetronimoName].default}`;

      image.onload = function() {
        imageCount += 1;
        this.images[tetronimoName] = image;

        if (imageCount === totalImageCount) {
          Render.run(this.renderer);
        }
      }.bind(this);
    });
  }

  public render(nextPiece: Matter.Body, bodies: Array<Matter.Body>) {
    this.nextPieceContext.fillStyle = '#fff';
    this.nextPieceContext.fillRect(5, 5, 100, 100);
    this.nextPieceContext.beginPath();

    const parts = nextPiece.parts.slice(1); // Removing the reference to self

    parts.forEach(part => {
      // @ts-ignore
      const { name, vertices } = part;
      const vertex = vertices[0];

      this.nextPieceContext.drawImage(
        this.images[name],
        vertex.x - 47,
        name === 'I' ? vertex.y + 95 : vertex.y + 85,
        21,
        21
      );
    });
  }
}
