import * as THREE from 'three';
import { BuildingBlock } from './BuildingBlock.js';

export class Building extends THREE.Object3D{
    constructor(parent, height, reclaimerProperties, models){
        super();
        this.parent = parent;
        this.reclaimerProperties = reclaimerProperties;
        this.physicsworld = reclaimerProperties.physicsworld;
        this.height = height;
        this.buildingBlocks = [];
        this.models = models;

        const  buildingTypes = {
            0: "Park",
            1: "House",
            2: "Apartment",
            3: "Skyscraper"
        }

        this.type = buildingTypes[height];
    }

    colourDebug(){
        this.buildingBlocks.forEach(element => {
            element.colourDebug();
        });
    }

    createBuilding(x, y, size){


        //Placeholder for height of base of building.
        let positions = this.reclaimerProperties.land.children[0].geometry.attributes.position;
        let xs = new Float32Array(positions.count);
        let ys = new Float32Array(positions.count);
        let zs = new Float32Array(positions.count);

        let zVal = 0.2;
         for (let i = 0; i < positions.count; i++) {
            let found = false;
                xs[i] = Math.floor(positions.getX(i)) == x - size/2;
                ys[i] = Math.floor(positions.getY(i)) == y - size/2;
                //get first x = 1
                if(xs[i] == 1 && ys[i] == 1){
                    zVal = positions.getZ(i);
                    found = true;
                }
            if (found == true){
                break;
            }
         }
        let z = zVal + 0.2; 
        // this.position.setZ(15)

        //create unique id for each building based on its location
        this.buildingID = x * 1000 + y;

        //This for loop should just take height of building (in blocks) not z
        for(var i = 0; i < this.height; i++){
 
            var block = new BuildingBlock(this.parent, this.height, this.buildingID, this.reclaimerProperties, this.models)
            block.createBlock(x -size/2,z + i,y -size/2);
            this.buildingBlocks.push(block);
        }
    }

    getPosition(){
        return new THREE.Vector3(this.position.x, 0.2, this.position.y);
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

    // get a block at height 
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