import { RandomHelper } from './random-helper';
import { WaitHelper } from './wait-helper';

export class Utils {
  private _random: RandomHelper;
  constructor() {
    this._random = new RandomHelper();
  }
  get random() {
    return (this._random ??= new RandomHelper());
  }
  get wait() {
    return new WaitHelper();
  }
}

export const utils = new Utils();
