import { Engine as MEngine } from 'matter-js';
import { GRAVITY } from '../constants';

export default class Engine {
  private instance: MEngine;

  constructor() {
    this.instance = MEngine.create();
    this.instance.world.gravity.y = GRAVITY;
  }

  update(delta: number) {
    MEngine.update(this.instance, delta);
  }

  run() {
    MEngine.run(this.instance);
  }

  getInstance() {
    return this.instance;
  }

  getWorld() {
    return this.instance.world;
  }
}
