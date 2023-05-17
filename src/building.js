import * as THREE from 'three';
import { BuildingBlock } from './BuildingBlock.js';

export class Building{
    constructor(scene, physicsworld, height){
        this.scene = scene;
        this.physicsworld = physicsworld;
        this.height = height;
        this.buildingBlocks = [];
        this.position = new THREE.Vector2();

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

        for(var i = 0.2; i < this.height; i++){
            var block = new BuildingBlock(this.scene, this.physicsworld, this.height);
            block.createBlock(x -size/2,i,y -size/2);
            this.buildingBlocks.push(block);
        }
    }

    getPosition(){
        let worldPos = new THREE.Vector3(this.position.x, 0.2, this.position.y);
        return worldPos;
    }

    getHeight(){
        return this.height;
    }

    getType(){
        return this.type;
    }

    // get a block at height 
    getBlock(height){
        return this.buildingBlocks[height];
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