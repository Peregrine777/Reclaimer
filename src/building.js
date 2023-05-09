import { BuildingBlock } from './BuildingBlock.js';

export class Building{
    constructor(scene, physicsworld, height){
        this.scene = scene;
        this.physicsworld = physicsworld;
        this.height = height;
        this.building = [];
    }

    createBuilding(x,y){
        var posY = 0;
        for(var i = 0; i < this.height; i++){
            var block = new BuildingBlock(this.scene, this.physicsworld, this.height);
            block.createBlock(x,posY,y);
            this.building.push(block);
            posY += 0.8;
        }
    }

    updateBuilding (){
        this.building.forEach(element => {
            element.updateBlock();
        });
    }

}