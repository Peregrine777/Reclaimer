import * as THREE from 'three';
import * as CANNON from 'cannon-es';


export class BuildingBlock {
      
    constructor(scene, physicsworld, type){
        this.scene = scene;
        this.physicsworld = physicsworld;
        this.type = type;
        this.mass = 0; 
        this.blockBody;
        this.blockMesh;
        this.materials = [];
        var material_white = new THREE.MeshLambertMaterial();
        var material_red = new THREE.MeshLambertMaterial();
        var material_blue = new THREE.MeshLambertMaterial();
        material_white.color =  new THREE.Color(0.9,0.9,0.9);
        material_red.color =  new THREE.Color(1,0,0);
        material_blue.color =  new THREE.Color(0,0,1);
        // use null value in first element to offset indexes by 1
        this.materials.push(null);
        this.materials.push(material_white);
        this.materials.push(material_red);
        this.materials.push(material_blue);
    }


    createBlock(x, y, z){
        this.blockBody = new CANNON.Body({
            type: CANNON.Body.DYNAMIC,
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(0.4,0.4,0.4)),
          });
        this.blockBody.position.set(x, y + 0.4, z);
        this.physicsworld.addBody(this.blockBody);

        const box_geo = new THREE.BoxGeometry(0.8,0.8,0.8);
        this.blockMesh = new THREE.Mesh(box_geo, this.materials[this.type]);
        this.blockMesh.castShadow = true;
        this.blockMesh.recieveShadow = true;
        this.scene.add(this.blockMesh);
    }

    updateBlock(){
        this.blockMesh.position.copy(this.blockBody.position);
        this.blockMesh.quaternion.copy(this.blockBody.quaternion);
    }
}