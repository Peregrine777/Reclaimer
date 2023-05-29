import * as THREE from 'three';
import { randFloat, randInt, smoothstep } from './MathUtils.js';
import { Building } from './Building.js';

export class City extends THREE.Object3D {
    size = 0;
    cityRadius = 0;
    n = null;


    constructor (size, reclaimerProperties) {
        super();
        this.cityRadius = size * 0.5;
        this.size = size;
        this.buildings = [];
        this.reclaimerProperties = reclaimerProperties;
        this.density = 1.0;

        //Center of the map
        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);


        // create array of tilemap positions
        this.map = new Array(size);
        for (let i = 0; i < size; i++) {
            this.map[i] = new Array(size);
            for (let j = 0; j < size; j++) {
                const distX = Math.abs(this.centerX - i);
                const distY = Math.abs(this.centerZ - j);
                const dist = Math.sqrt(distX * distX + distY * distY);
                //Randomise building heights
                const buildingChance = Math.max(0, 1 - dist / Math.max(this.centerX, this.centerZ)) * this.density;
                let randomHeight = randInt(1,3);
                
                // this.map[i][j] = {type: "park", height : 0, building : null};
                 this.map[i][j] = {height : randomHeight, building : null};

                
            }
        }

        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);
    }

    // Adds building objects to the parent object
    // TODO - make this a proper object3D such that we don't pass parent
    addBuildings(parent){
        //loop through map and add buildings   
        for (let i = 0; i < this.size; i += 2) {
            for (let j = 0; j < this.size; j += 2) {
                //console.log(tile);
                let building = new Building(parent, this.map[i][j].height, this.reclaimerProperties);
                this.map[i][j].building = building;
                this.buildings.push(building);
                // offset buildings to the centre of the terrain
                building.createBuilding(i,j, this.size);
                building.updateBuilding();
            }
        }
    }

    getBuilding(i, j){ 
        return this.map[i][j].building;
    }

    getRandomTallBuilding(radius){
        let loops = 0;
        let x = randInt(2, radius) * 2 - 2;
        let y = randInt(2, radius) * 2 - 2;
        let b = this.getBuilding(x, y)

        // generate random coordinates until a tall building is found
        while(b.height < 2){
            x = randInt(2, radius) * 2 - 2;
            y = randInt(2, radius) * 2 - 2;
            b = this.getBuilding(x, y);

            // after looping 100 times
            if(loops > 100){
                // there is likely no tall buildings to find
                // exit loop
                break;
            }
            loops++;
        }

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

  //////////////
  // Gaussian //
  //////////////
  function gaussian(x, a, c) {
    return a * Math.exp(-Math.pow((x) / c, 2));
}