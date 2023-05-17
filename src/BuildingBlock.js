import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Fragment } from './Fragment.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


export class BuildingBlock {
      
    constructor(scene, physicsworld, height){
        this.scene = scene;
        this.physicsworld = physicsworld;
        this.height = height;
        this.mass = 0; 
        this.blockBody;
        this.blockMesh;
        this.position = new THREE.Vector3();
        this.materials = [];
        var material_white = new THREE.MeshPhysicalMaterial();
        var material_red = new THREE.MeshPhysicalMaterial();
        var material_blue = new THREE.MeshPhysicalMaterial();
        var material_debug = new THREE.MeshPhysicalMaterial();
        material_white.color =  new THREE.Color(0.9,0.9,0.9);
        material_red.color =  new THREE.Color(1,0,0);
        material_blue.color =  new THREE.Color(0,0,1);
        material_debug.color = new THREE.Color(1.0, 1.0, 0);
        // use null value in first element to offset indexes by 1
        this.materials.push(null);
        this.materials.push(material_white);
        this.materials.push(material_red);
        this.materials.push(material_blue);
        this.materials.push(material_debug);
    }

    //debug function
    colourDebug(){
        //console.log("colour block debug");
        this.blockMesh.material = this.materials[4];
    }


    createBlock(x, y, z){
        this.position.set(x, y, z);
        this.blockBody = new CANNON.Body({
            type: CANNON.Body.DYNAMIC,
            mass: 5,
            shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
          });
        this.blockBody.position.set(x, y + 0.5, z);
        this.physicsworld.addBody(this.blockBody);

        const box_geo = new THREE.BoxGeometry(1,1,1);
        this.blockMesh = new THREE.Mesh(box_geo, this.materials[this.height]);
        this.blockMesh.castShadow = true;
        this.blockMesh.recieveShadow = true;
        this.scene.add(this.blockMesh);
    }

    shatterBlock(){
        this.physicsworld.removeBody(this.blockBody);
        this.scene.remove(this.blockMesh);
        console.log("Shatter");
        // load fractured cube 
        console.log(this.position);
        this.createCube(this.position.x,this.position.y + 0.5,this.position.z);
    }

    createCube(x, y, z){
        console.log("Create Cube");

        let dynamicObjects = new THREE.Object3D();
        dynamicObjects.position.set(x,y,z);
        let physicsworld = this.physicsworld;
        let materials = this.materials;
        let height = this.height;

        let fragments = [];
        let meshes = [];
        let objLoader = new OBJLoader();
        
        objLoader.load('assets/Objects/fracturedCube-cubes2.obj', function ( object ){
          object.traverse( function ( child ) {
              if ( child instanceof THREE.Mesh ) {
                child.material = materials[height];
                meshes.push(child);
                var position = new THREE.Vector3();

                // get coordinates
                child.geometry.computeBoundingBox();
                var boundingBox = child.geometry.boundingBox;

                position.subVectors( boundingBox.max, boundingBox.min);
                position.multiplyScalar(0.5);
                position.add( boundingBox.min );
                position.add( dynamicObjects.position );

                //console.log(position);
                let fragment = new Fragment(physicsworld , child, position);
                fragments.push(fragment);
                fragment.updateMesh();
              }
          } );
          dynamicObjects.add( object );
        } );
        this.scene.add(dynamicObjects);
    }

    unfreezeBlock(){
        this.blockBody.mass = 5; 
        this.blockBody.updateMassProperties();
    }

    freezeBlock(){
        this.blockBody.mass = 0; 
        this.blockBody.updateMassProperties();
    }

    updateBlock(){
        this.blockMesh.position.copy(this.blockBody.position);
        this.blockMesh.quaternion.copy(this.blockBody.quaternion);
    }
}