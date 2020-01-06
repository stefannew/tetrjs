import Renderer from './renderer';
import Engine from './engine';
import GameController from './game-controller';

export default class Game {
  engine: Engine;
  renderer: Renderer;
  gameController: GameController;

  constructor(
    renderer: Renderer,
    engine: Engine,
    gameController: GameController
  ) {
    this.renderer = renderer;
    this.engine = engine;
    this.gameController = gameController;
  }

  run() {
    this.engine.run();

    let lastTime: number;

    function loop(time: number) {
      requestAnimationFrame(loop.bind(this));

      const delta = lastTime ? (time - lastTime) / 1000 : 0;

      this.engine.update(delta, this.world);
      this.renderer.render(
        this.gameController.getNextPiece(),
        this.gameController.getBodies()
      );

      lastTime = time;
    }

    requestAnimationFrame(loop.bind(this));
  }
}
