import * as THREE from 'three';
import { BuildingBlock } from './BuildingBlock.js';

export class Building{
    constructor(parent, physicsworld, height, scene){
        this.parent = parent;
        this.physicsworld = physicsworld;
        this.height = height;
        this.buildingBlocks = [];
        this.position = new THREE.Vector2();
        this.scene = scene;


        this.parent = parent;

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
        this.position.setX(x);
        this.position.setY(y);

        //create unique id for each building based on its location
        this.id = x * 1000 + y;

        for(var i = 0.2; i < this.height; i++){

            var block = new BuildingBlock(this.parent, this.physicsworld, this.height, this.id, this.scene);
            block.createBlock(x -size/2,i,y -size/2);
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