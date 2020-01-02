import { TETRONIMO_NAMES } from '../constants';

export const degreesToRadians = (degrees: number) => degrees * 0.0174533;
export const radiansToDegrees = (radians: number) => radians / 0.0174533;

export const getRandomTetronimoName = () =>
  TETRONIMO_NAMES[Math.floor(Math.random() * TETRONIMO_NAMES.length)];
