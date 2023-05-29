import * as THREE from 'three';
import { randFloat, randInt, smoothstep } from './MathUtils.js';
import { Building } from './Building.js';

export class City extends THREE.Object3D {
    size = 0;
    cityRadius = 0;
    n = null;


    constructor (parent, size, reclaimerProperties) {
        super();
        this.parent = parent;
        this.cityRadius = size * 0.5;
        this.size = size;
        this.buildings = [];
        this.reclaimerProperties = reclaimerProperties;
        this.density = 5.0;

        //Center of the map
        this.centerX = Math.floor(size/2);
        this.centerZ = Math.floor(size/2);

        let noise = 0.6;

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
                // let randomHeight = randInt(1,5);
                
                if(Math.random() > buildingChance){
                    this.map[i][j] = {type: "park", height : 0, building : null};
                }
                else if (i % 2 == 1 || j % 2 == 1){
                    this.map[i][j] = {type: "road", height : 0, building : null};
                } 
                else{
                    
                    let gaussHeight = Math.max(this.gaussianHeight(this.size,this.density, dist),1);
                    let noiseHeight = Math.max(this.noiseHeight(this.size,this.density, dist),1)
                    let height = Math.max(1,Math.floor(noise*noiseHeight + gaussHeight*(1-noise)));
                    this.map[i][j] = {height : height, building : null};
                    let building = new Building(parent, this.map[i][j].height, this.reclaimerProperties);
                    this.map[i][j].building = building;
                    this.buildings.push(building);
                    // offset buildings to the centre of the terrain
                    building.createBuilding(i,j, this.size);
                    building.updateBuilding();
                }


                // tile.setHeight(height);

                
                
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
        //TODO: We have a list of buildings, use that instead of x,y 
        // let b= this.buildings[Math.floor(Math.random() * this.buildings.length)];
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

    gaussianHeight(size,density, dist){
        let gaussR = gaussian(
                    dist,
                    Math.min((size*size*density)/125.5,20),
                    size/10);
          return gaussR;
    }

    noiseHeight(size, density){
        let noiseHeight = randInt(0, Math.min((size*size*density)/255,20));
        return noiseHeight;
    }
}

  //////////////
  // Gaussian //
  //////////////
  function gaussian(x, a, c) {
    return a * Math.exp(-Math.pow((x) / c, 2));
}