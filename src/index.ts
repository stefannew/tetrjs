import { GAME_WIDTH, GAME_HEIGHT } from './constants';

// @ts-ignore
import './style.css';
import Engine from 'engine/engine';
import Game from 'engine/Game';
import Renderer from 'engine/renderer';
import GameController from 'engine/game-controller';

const engine = new Engine();
const renderer = new Renderer(GAME_WIDTH, GAME_HEIGHT, engine.getInstance());
const game = new Game(renderer, engine);

new GameController(engine);

game.run();
