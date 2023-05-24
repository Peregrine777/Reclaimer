import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Fragment } from './Fragment.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


export class BuildingBlock extends THREE.Object3D   {

    shatterArray;
    materialsArray;
      
    constructor(parent, height, buildingID, reclaimerProperties){
        super();
        this.parent = parent;
        this.height = height;
        this.mass = 0; 
        this.buildingID = buildingID;
        this.blockBody;
        this.blockMesh;
        this.isShattered = false;
        this.materialsArray = [];
        this.material;
        this.shatterArray = [];
        this.reclaimerProperties = reclaimerProperties;
        this.physicsworld = reclaimerProperties.physicsworld;
        this.defaults();
    }

    defaults(){
        var material_white = new THREE.MeshPhysicalMaterial();
        var material_red = new THREE.MeshPhysicalMaterial();
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

        let model = new THREE.Object3D();
        let objLoader = new OBJLoader();
        let material = this.materialsArray[this.height];

        // Load in 3D model
        objLoader.load('assets/Objects/Buildings/house1obj.obj', function ( object ){
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material;
                    child.castShadow = true;
                    child.recieveShadow = true;
                    
                  
                }
            } );
            model.add( object );
          } );
          this.blockMesh = model;
          this.parent.add(this.blockMesh);

        // const box_geo = new THREE.BoxGeometry(1,1,1);
        // this.blockMesh = new THREE.Mesh(box_geo, this.material);
        // this.blockMesh.castShadow = true;
        // this.blockMesh.recieveShadow = true;

        // this.parent.add(this.blockMesh);
    }

    shatterBlock(){
        console.log("shatter block");
        this.physicsworld.removeBody(this.blockBody);
        this.parent.remove(this.blockMesh);
        console.log("Shatter");
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
        let material = this.material;

        let fragments = [];

        //let meshes = [];
        let objLoader = new OBJLoader();
        
        objLoader.load('assets/Objects/fracturedCube-cubes2.obj', function ( object ){
          object.traverse( function ( child ) {
              if ( child instanceof THREE.Mesh ) {
                //console.log(child);
                child.material = material;
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