import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { Fragment } from './Fragment.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {  BuildingShader } from './Shaders/BuildingMaterial.js';


export class BuildingBlock {

    shatterArray;
    materialsArray;
    sunDirection = new THREE.Vector3();
      
    constructor(parent, physicsworld, height, id, scene){
        this.parent = parent;
        this.physicsworld = physicsworld;
        this.height = height;
        this.mass = 0; 
        this.id = id;
        this.scene = scene;
        let sun = this.scene.traverse(function(child){
            console.log(child)
        });

        console.log(sun);

        // this.sunDirection = sunDirection;
        this.blockBody;
        this.blockMesh;
        this.isShattered = false;
        this.position = new THREE.Vector3();
        this.materialsArray = [];
        this.material;
        this.shatterArray = [];

        this.defaults();
    }

    defaults(){
        var material_white = new THREE.MeshPhysicalMaterial();
        var material_red = new THREE.ShaderMaterial();
        material_red.uniforms = BuildingShader.uniforms;
        material_red.vertexShader = BuildingShader.vertexShader;
        material_red.fragmentShader = BuildingShader.fragmentShader;
        //console.log(this.sunDirection);
        material_red.uniforms.lightDirection.value = this.sunDirection;

        var material_blue = new THREE.MeshPhysicalMaterial();
        var material_debug = new THREE.MeshPhysicalMaterial();
        material_white.color =  new THREE.Color(0.9,0.9,0.9);
        material_red.color =  new THREE.Color(1,0,0);
        material_blue.color =  new THREE.Color(0,0,1);
        material_debug.color = new THREE.Color(1, 1, 0);
        // use null value in first element to offset indexes by 1
        this.materialsArray.push(null);
        this.materialsArray.push(material_white);
        this.materialsArray.push(material_red);
        this.materialsArray.push(material_blue);
        this.materialsArray.push(material_debug);
    }

    //debug function
    colourDebug(){
        //console.log("colour block debug");
        this.material = this.materialsArray[4];
        this.blockMesh.material = this.material;
    }


    createBlock(x, y, z){
        this.position.set(x, y, z);
        this.blockBody = new CANNON.Body({
            type: CANNON.Body.DYNAMIC,
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)),
            collided: false,
          });
        this.blockBody.position.set(x, y + 0.5, z);
        this.physicsworld.addBody(this.blockBody);

        // ON COLLISION
        this.blockBody.addEventListener('collide', function(e){
            //console.log("COLLIDE");
            
            // check if colliding with blocks from a different building
            // console.log(e.body.buildingID);
            // console.log(e.target.buildingID);

            //if( e.body.buildingID != e.target.buildingID){
                e.body.collided = true;
            //}
        });

        const box_geo = new THREE.BoxGeometry(1,1,1);
        this.material = this.materialsArray[this.height];
        this.blockMesh = new THREE.Mesh(box_geo, this.material);
        this.blockMesh.castShadow = true;
        this.blockMesh.recieveShadow = true;
        this.parent.add(this.blockMesh);
    }

    shatterBlock(){
        this.physicsworld.removeBody(this.blockBody);
        this.parent.remove(this.blockMesh);
        //console.log("Shatter");
        // load fractured cube 
        //console.log(this.position);
        this.shatterArray = this.createCube(this.position.x,this.position.y + 0.5,this.position.z);
        //console.log(this.shatterArray);
    }

    createCube(x, y, z){
        //console.log("Create Cube");

        let dynamicObjects = new THREE.Object3D();
        dynamicObjects.position.set(x,y,z);
        let physicsworld = this.physicsworld;

        let fragments = [];

        //let meshes = [];
        let objLoader = new OBJLoader();
        
        objLoader.load('assets/Objects/fracturedCube-cubes2.obj', function ( object ){
          object.traverse( function ( child ) {
              if ( child instanceof THREE.Mesh ) {
                //console.log(child);
                child.material = this.material;
                //meshes.push(child);
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
        this.parent.add(dynamicObjects);
        return fragments;
    }

    unfreezeBlock(){
        if(this.shatterArray.length == 0){
            this.blockBody.mass = 5; 
            this.blockBody.updateMassProperties();
        } 
        else {
            this.shatterArray.forEach(element => {
                element.unfreezeMesh();
            });
        }
        
    }

    freezeBlock(){
        if(this.shatterArray.length == 0){
            this.blockBody.mass = 0; 
            this.blockBody.updateMassProperties();
        } 
        else {
            this.shatterArray.forEach(element => {
                element.freezeMesh();
            });
        }
    }

    updateBlock(){
        if(this.shatterArray.length == 0){
            if(this.blockBody.collided && !this.isShattered){
                this.isShattered = true;
                //this.shatterBlock();
            }
            this.blockMesh.position.copy(this.blockBody.position);
            this.blockMesh.quaternion.copy(this.blockBody.quaternion);
        } else {
            this.shatterArray.forEach(element => {
                element.updateMesh();
            });
        }
        
    }
}