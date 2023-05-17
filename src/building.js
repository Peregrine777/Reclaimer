import { BuildingBlock } from './BuildingBlock.js';

export class Building{
    constructor(scene, physicsworld, height){
        this.scene = scene;
        this.physicsworld = physicsworld;
        this.height = height;
        this.buildingBlocks = [];
    }

    colourDebug(){
        this.buildingBlocks.forEach(element => {
            element.colourDebug();
        });
    }

    createBuilding(x,y){
        var posY = 0.2;
        for(var i = 0; i < this.height; i++){
            var block = new BuildingBlock(this.scene, this.physicsworld, this.height);
            block.createBlock(x,posY,y);
            this.buildingBlocks.push(block);
            posY += 0.8;
        }
    }

    updateBuilding (){
        this.buildingBlocks.forEach(element => {
            element.updateBlock();
        });
    }
}