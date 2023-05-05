import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
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
                //ToDo Placeholder for tilemap - just random houses and apartments
                let rand = randInt(1,2);
                rand == 1 ? this.map[i][j] = {height: 1, type: "house"} : this.map[i][j] = {height: 1, type: "apartment"};
            }
        }

        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);
    }

    addBuildings(cityObject){
        let b = new Building();

        //loop through map and add buildings        
        for (let i = 0; i < this.size; i += 2) {
            for (let j = 0; j < this.size; j += 2) {
                let tile = this.map[i][j];

                //get building mesh based on tile properties {height, type}
                let building = b.getBuilding(1, this.map[i][j].type).clone();
                building.position.set(i, 1, j);
                building.castShadow = true;
                building.receiveShadow = true;
                cityObject.add(building);
            }
        }
    }
}