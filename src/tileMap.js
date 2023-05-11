import { randFloat, randInt, smoothstep } from '../src/MathUtils.js';
import { Building } from './building.js';

export class TileMap {
    size = 0;
    cityRadius = 0;
    n = null;


    constructor (size, cityVals, cityoffset) {
        this.cityRadius = size * 0.5;
        this.size = size;
        this.buildings = [];

        // create array of tilemap positions
        this.map = new Array(size);
        for (let i = 0; i < size; i++) {
            this.map[i] = new Array(size);
            for (let j = 0; j < size; j++) {
                //Randomise building heights
                let rand = randInt(1,3);
                if(rand == 1){
                    this.map[i][j] = {height: 1, type: "house"};
                } 
                else if (rand == 2){
                    this.map[i][j] = {height: 2, type: "apartment"};
                }
                else if (rand == 3){
                    this.map[i][j] = {height: 3, type: "skyscraper"};
                }
            }
        }

        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);
    }

    addBuildings(scene, physicsworld){
        //loop through map and add buildings   
        for (let i = 0; i < this.size; i += 2) {
            for (let j = 0; j < this.size; j += 2) {
                let tile = this.map[i][j];

                let building = new Building(scene, physicsworld, tile.height);
                this.buildings.push(building);
                // offset buildings to the centre of the terrain
                building.createBuilding(i -this.size/2,j -this.size/2);
                building.updateBuilding();
            }
        }
    }

    updateBuildings (){
        this.buildings.forEach(element => {
            element.updateBuilding();
        });
    }
}