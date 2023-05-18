import { randFloat, randInt, smoothstep } from '../src/MathUtils.js';
import { Building } from './building.js';

export class TileMap {
    size = 0;
    cityRadius = 0;
    n = null;


    constructor (size) {
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
                this.map[i][j] = {height : randomHeight, building : null};

                
            }
        }

        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);
    }

    addBuildings(parent, physicsworld, scene){
        //loop through map and add buildings   
        for (let i = 0; i < this.size; i += 2) {
            for (let j = 0; j < this.size; j += 2) {
                //console.log(tile);

                let building = new Building(parent, physicsworld, this.map[i][j].height, scene);
                this.map[i][j].building = building;
                this.buildings.push(building);
                // offset buildings to the centre of the terrain
                building.createBuilding(i,j, this.size);
                building.updateBuilding();
            }
        }
    }

    getBuilding(i, j){ 
        let b = this.map[i][j].building;
        //console.log(b);
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
            //console.log(element);
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