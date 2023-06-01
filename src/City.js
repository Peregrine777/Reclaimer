import * as THREE from 'three';
import { randFloat, randInt, smoothstep } from './MathUtils.js';
import { Building } from './Building.js';

export class City extends THREE.Object3D {
    size = 0;
    citySize = 0;
    n = null;


    constructor (parent, size, reclaimerProperties) {
        super();
        this.parent = parent;
        this.citySize = size * 5;
        this.size = size;
        this.buildings = [];
        this.reclaimerProperties = reclaimerProperties;
        

        //Center of the map
        this.centerX = Math.floor(this.citySize/2);
        this.centerZ = Math.floor(this.citySize/2);

        let noise = 0.1;
        this.density = 1.0;

        // create array of tilemap positions
        this.map = new Array(this.citySize);

        for (let i = 0; i < this.citySize; i++) {
            this.map[i] = new Array(this.citySize);
            for (let j = 0; j < this.citySize; j++) {
                
                const distX = Math.abs(this.centerX - i);
                const distY = Math.abs(this.centerZ - j);
                const dist = Math.sqrt(distX * distX + distY * distY);

                //Randomise building chance based on distance from centre
                const buildingChance = Math.max(0, 1 - dist / Math.max(this.centerX, this.centerZ)) * this.density;
                
                //Set tile type road, park or building
                if(Math.random() > buildingChance){
                    this.map[i][j] = {type: "park", height : 0, building : null};
                }
                else if (i % 2 == 1 || j % 2 == 1){
                    this.map[i][j] = {type: "road", height : 0, building : null};
                } 
                else{
                    //If tile type is building, generate height as mix of noise, gaussian
                    let gaussHeight = Math.max(this.gaussianHeight(this.citySize,this.density, dist),1);
                    let noiseHeight = Math.max(this.noiseHeight(this.citySize,this.density, dist),1)
                    let height = Math.max(1,Math.floor(noise*noiseHeight + gaussHeight*(1-noise)));
                    this.map[i][j] = {type: "building" ,height : height, building : null};

                    //Make Building and add to list of buildings
                    let building = new Building(parent, this.map[i][j].height, this.reclaimerProperties);
                    this.map[i][j].building = building;
                    if(building.height > 0){
                        this.buildings.push(building);
                    }

                    // offset buildings to the centre of the terrain
                    building.createBuilding(i,j, this.citySize);
                    building.updateBuilding();
                }            
            }
        }
    }

    getBuildingsCount(){
        return this.buildings.length;
    }

    getTileFromMap(i, j){ 
        return this.map[i][j].building;
    }

    getRandomBuildings(numberOfBuildings){
        let b = [];

        for(let i = 0; i < numberOfBuildings; i++){
          let building = this.getRandomBuilding();
          b.push(building);
        }
        return b;
      }

    getRandomBuilding(){
        let building = this.buildings[randInt(0, this.buildings.length)];
        return building;
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
                    dist*2,
                    Math.min((size*size*density)/125.5,10),
                    size/6);
          return gaussR;
    }

    noiseHeight(size, density){
        let noiseHeight = randInt(0, Math.min((size*size*density)/255,20));
        return noiseHeight;
    }
}

  function gaussian(x, a, c) {
    return a * Math.exp(-Math.pow((x) / c, 2));
}