import Renderer from './renderer';
import Engine from './engine';

export default class Game {
  engine: Engine;
  renderer: Renderer;

  constructor(renderer: Renderer, engine: Engine) {
    this.renderer = renderer;
    this.engine = engine;
  }

  run() {
    this.engine.run();

    let lastTime: number;

    function loop(time: number) {
      requestAnimationFrame(loop.bind(this));

      const delta = lastTime ? (time - lastTime) / 1000 : 0;

      this.engine.update(delta, this.world);

      lastTime = time;
    }

    requestAnimationFrame(loop.bind(this));
  }
}
