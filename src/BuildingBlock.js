import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Fragment } from './Fragment.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


export class BuildingBlock extends THREE.Object3D   {
      
    constructor(parent, height, buildingID, reclaimerProperties, models){
        super();
        this.parent = parent;
        this.height = height;
        this.mass = 0; 
        this.buildingID = buildingID;
        this.blockBody;
        this.blockMesh;
        this.isShattered = false;
        this.materialsArray = [];
        this.shatterArray = [];
        this.reclaimerProperties = reclaimerProperties;
        this.physicsworld = reclaimerProperties.physicsworld;
        this.models = models;
        this.placedModels = [];
        //parent.add(this.models[1])
        //this.defaults();
    }

    defaults(){
        var material_house = new THREE.MeshPhysicalMaterial();
        var material_apartment = new THREE.MeshPhysicalMaterial();
        var material_skyscraper = new THREE.MeshPhysicalMaterial();
        var material_debug = new THREE.MeshPhysicalMaterial();

        material_house.color =  new THREE.Color( 0xfddb53 );
        material_apartment.color =  new THREE.Color( 0xd67229 );
        material_skyscraper.color =  new THREE.Color( 0xc5c6d0 );
        material_debug.color = new THREE.Color(1, 1, 0);
        // use null value in first element to offset indexes by 1
        this.materialsArray.push(null);
        this.materialsArray.push(material_house);
        this.materialsArray.push(material_apartment);
        this.materialsArray.push(material_skyscraper);
        this.materialsArray.push(material_debug);

        let materialIndex = Math.min(this.height, 3)
        this.material = this.materialsArray[materialIndex];

        const objLoader = new OBJLoader();

        
        let material = this.material;
        let house = new THREE.Object3D();
        let apart = new THREE.Object3D();
        let sky = new THREE.Object3D();


        
        // objLoader.load('assets/Objects/Buildings/house1obj.obj', function ( object ){

        //     object.traverse( function ( child ) {
        //         if ( child instanceof THREE.Mesh ) {
        //             child.material = material;
        //             child.castShadow = true;
        //             child.recieveShadow = true;
        //         }
        //     } );
        //     house.add(object);
        //   } );

        //   objLoader.load('assets/Objects/Buildings/skyScraper1.obj', function ( object ){

        //     object.traverse( function ( child ) {
        //         if ( child instanceof THREE.Mesh ) {
        //             child.material = material;
        //             child.castShadow = true;
        //             child.recieveShadow = true;
        //         }
        //     } );
        //     apart.add(object);
        //   } );


        // this.models.push(house);
        // this.models.push(apart);

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

        this.updateMatrix();

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

        
        if (this.height == 0){
            // file +='park1.obj';
        }
        if(this.height == 1){
            //model =  model.copy(this.models[0]); 
            this.blockMesh = this.models[0].setMatrixAt(0, this.matrix);
        } 
        else if( this.height == 2){
            this.blockMesh = this.models[1].setMatrixAt(0, this.matrix);
        } 
        else
        {
            this.blockMesh = this.models[2].setMatrixAt(0, this.matrix);
        }

        //this.loadModel();
        //console.log(this.blockMesh);
        //this.parent.add(this.blockMesh);
    }

    loadModel(){
        let objLoader = new OBJLoader();
        let tempMesh = new THREE.Mesh();
        let material = this.material;
        let file = 'assets/Objects/Buildings/';

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