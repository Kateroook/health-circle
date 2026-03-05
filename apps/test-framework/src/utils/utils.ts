import { DateBuilder } from "./date-helper";
import { RandomHelper } from "./random-helper"

export class Utils {
    private _random : RandomHelper;
    constructor(){
        this._random = new RandomHelper();
    }
    get random() {
        return this._random ??= new RandomHelper();
    }
    get date() {
        return new DateBuilder();
    }
}

export const utils = new Utils();