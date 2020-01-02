import { Render, Engine } from 'matter-js';

export default class Renderer {
  renderer: Render;
  width: number;
  height: number;

  constructor(width: number, height: number, engine: Engine) {
    this.renderer = Render.create({
      element: document.body,
      engine,
      options: {
        background: 'transparent',
        height,
        width,
        wireframes: false
      }
    });

    Render.run(this.renderer);
  }
}
