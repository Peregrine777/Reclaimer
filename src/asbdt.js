import * as THREE from 'three';
import { BuildingBlock } from './BuildingBlock.js';
import { randInt } from './MathUtils.js';

export class Building extends THREE.Object3D{
    constructor(parent, height, reclaimerProperties){
        super();
        this.parent = parent;
        this.reclaimerProperties = reclaimerProperties;
        this.physicsworld = reclaimerProperties.physicsworld;
        this.height = height;
        this.buildingBlocks = [];

        const  buildingTypes = {
            0: "Park",
            1: "House",
            2: "Apartment",
            3: "Skyscraper"
        }

        this.type = buildingTypes[height];
    }

    colourDebug(){
        this.buildingBlocks.forEach(block => {
            block.colourDebug();
        });
    }

    createBuilding(x, y, size){


        //Placeholder for height of base of building.
        let positions = this.reclaimerProperties.land.children[0].geometry.attributes.position;
        let xs = new Float32Array(positions.count);
        let ys = new Float32Array(positions.count);
        let zVal = 0.0;

        //  for (let i = 0; i < positions.count; i++) {
        //     let found = false;
        //         xs[i] = Math.floor(positions.getX(i)) == x - size/2;
        //         ys[i] = Math.floor(positions.getY(i)) == y - size/2;
        //         //get first x = 1
        //         if(xs[i] == 1 && ys[i] == 1){
        //             zVal = positions.getZ(i);
        //             found = true;
        //         }
        //     if (found == true){
        //         break;
        //     }
        //  }
        let z = zVal + 0.2; 

        for(var i = 0; i < this.height; i++){
 
            var block = new BuildingBlock(this.parent, this.height, this.reclaimerProperties)
            block.createBlock(x -size/2,z + i,y -size/2);
            this.buildingBlocks.push(block);
        }
    }

    getRandomBlock(){
        return this.getBlock(randInt(0, this.getHeight() - 1));
      }

    getBlock(index){
        return this.buildingBlocks[index];
    }

    getPosition(){
        return this.position;
    }

    getHeight(){
        return this.height;
    }

    getType(){
        return this.type;
    }

    setType(type){
        this.type = type;
    }

    getBlock(height){
        if(height <= this.height){
            return this.buildingBlocks[height];
        }
        else{
            return null;
        }
    }

    freezeBuilding(){
        this.buildingBlocks.forEach(element => {
            element.freezeBlock();
        });
    }

    unfreezeBuilding(){
        this.buildingBlocks.forEach(element => {
            element.unfreezeBlock();
        });
    }

    updateBuilding (){
        this.buildingBlocks.forEach(element => {
            element.updateBlock();
        });
    }
}