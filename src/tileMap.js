import * as THREE from 'three';
import { ImprovedNoise } from '../build/math/ImprovedNoise.js';
import { randFloat, randInt, smoothstep } from '../src/MathUtils.js';
import { Building } from './building.js';

export class TileMap {
    size = 0;
    cityRadius = 0;
    n = null;


    constructor (size, cityVals, cityGenPoint) {
        this.cityRadius = size * 0.5;
        this.size = size;
        
        //this.density = density;

        this.map = new Array(size);
        for (let i = 0; i < size; i++) {
            this.map[i] = new Array(size);
            for (let j = 0; j < size; j++) {
                //ToDo Placeholder for tilemap
                this.map[i][j] = {height: 1, type: "house"};
            }
        }

        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);
    }

    addBuildings(cityObject){
        let b = new Building();

        
        for (let i = 0; i < this.size; i += 2) {
            for (let j = 0; j < this.size; j += 2) {
                let tile = this.map[i][j];
                // if (tile.height == 1) {
                    let building = b.buildings[0].object.clone();
                    console.log(building);
                    building.position.set(i, 0, j);
                    cityObject.add(building);
                // }
            }
        }
    }
}