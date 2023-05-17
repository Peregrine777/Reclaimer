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
                let randomHeight = randInt(1,3);
                this.map[i][j] = {height : randomHeight, type: "", building : null};

                if(randomHeight == 1){
                    this.map[i][j].type = "house";
                } 
                else if (randomHeight == 2){
                    this.map[i][j].type = "apartment";
                }
                else {
                    this.map[i][j].type = "skyscraper";
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
                //console.log(tile);
                let building = new Building(scene, physicsworld, this.map[i][j].height);
                this.map[i][j].building = building;
                this.buildings.push(building);
                // offset buildings to the centre of the terrain
                building.createBuilding(i -this.size/2,j -this.size/2);
                building.updateBuilding();
            }
        }
    }

    getBuilding(i, j){ 
        let b = this.map[i][j].building;
        console.log(b);
        //b.name = "debug";
        return b;
    }

    getBuildingsSurrounding(i, j){
        let surrounds = [
            this.getBuilding(i, j + 2),
            this.getBuilding(i + 2, j),
            this.getBuilding(i, j - 2),
            this.getBuilding(i - 2, j)
        ];
        surrounds.forEach(element =>{
            console.log(element);
            element.colourDebug();
        });
        return surrounds;
    }

    updateBuildings (){
        this.buildings.forEach(element => {
            element.updateBuilding();
        });
    }
}