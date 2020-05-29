import { GAME_WIDTH, GAME_HEIGHT } from './constants';

// @ts-ignore
import './style.css';
import Engine from 'engine/engine';
import Game from 'engine/game';
import Renderer from 'engine/renderer';
import GameController from 'engine/game-controller';

const engine = new Engine();
const renderer = new Renderer(GAME_WIDTH, GAME_HEIGHT, engine.getInstance());
const gameController = new GameController(engine);
const game = new Game(renderer, engine, gameController);

game.run();
