import * as THREE from 'three';

export class Building{
    constructor(){
        this.buildings = [];

        this.defaults();
    }

    getBuilding(height, type){
        for (let i = 0; i < this.buildings.length; i++) {
            let building = this.buildings[i];
            if (building.height == height && building.type == type) {
                return building.object;
            }
        }
        let newBuilding = this.createBuilding(height, type);
        this.buildings.push({
            height: height,
            type: type,
            object: newBuilding
        });
        return newBuilding;
    }

    defaults(){
        let defHouse = this.createBuilding(1, "house");
        let defApart = this.createBuilding(1, "apartment");
        defApart.material.color = new THREE.Color(0.5,0.5,0.5);

        this.buildings.push({
            height: 1,
            type: "house",
            object: defHouse
        });
        this.buildings.push({
            height: 1,
            type: "apartment",
            object: defApart
        });
    }

    createBuilding(height, type){
        let material = new THREE.MeshPhysicalMaterial({color: new THREE.Color(0.2,0.2,0.2)});
        let geom = new THREE.BoxGeometry(1,1,1);
        let object = new THREE.Mesh(geom,material);

        return object;
    }



}