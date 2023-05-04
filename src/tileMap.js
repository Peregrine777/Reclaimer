import * as THREE from 'three';
import { ImprovedNoise } from '../build/math/ImprovedNoise.js';
import { randFloat, randInt, smoothstep } from '../src/MathUtils.js';

export class TileMap {
    size = 0;
    cityRadius = 0;
    n = null;

    constructor (size, cityVals) {
        this.cityRadius = size * 0.5;
        this.size = size;
        //this.density = density;

        this.map = new Array(size);
        for (let i = 0; i < size; i++) {
            this.map[i] = new Array(size);
            for (let j = 0; j < size; j++) {
                this.map[i][j] = 0;
            }
        }

        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);

    }
}