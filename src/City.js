import * as THREE from 'three';
import { randFloat, randInt, smoothstep } from './MathUtils.js';
import { Building } from './Building.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



export class City extends THREE.Object3D {
    size = 0;
    citySize = 0;
    n = null;


    constructor (parent, size, reclaimerProperties) {
        super();
        this.parent = parent;
        this.citySize = size * 6;
        this.size = size;
        this.buildings = [];
        this.reclaimerProperties = reclaimerProperties;
        this.models = [];
        this.defaults();

        //Center of the map
        this.centerX = Math.floor(this.citySize/2);
        this.centerZ = Math.floor(this.citySize/2);

        let noise = 0.1;
        this.density = 0.70;

        // create array of tilemap positions
        this.map = new Array(this.citySize);
        for (let i = 0; i < this.citySize; i++) {
            this.map[i] = new Array(this.citySize);
            for (let j = 0; j < this.citySize; j++) {
                
                const distX = Math.abs(this.centerX - i);
                const distY = Math.abs(this.centerZ - j);
                const dist = Math.sqrt(distX * distX + distY * distY);
                //Randomise building chance based on distance from centre
                const buildingChance = Math.max(0, 1 - dist / Math.max(this.centerX, this.centerZ)) * this.density;
                
                //Set tile type road, park or building
                if(Math.random() > buildingChance){
                    this.map[i][j] = {type: "park", height : 0, building : null};
                }
                else if (i % 2 == 1 || j % 2 == 1){
                    this.map[i][j] = {type: "road", height : 0, building : null};
                } 
                else{
                    //If tile type is building, generate height as mix of noise, gaussian
                    let gaussHeight = Math.max(this.gaussianHeight(this.citySize,this.density, dist),1);
                    let noiseHeight = Math.max(this.noiseHeight(this.citySize,this.density, dist),1)
                    let height = Math.max(1,Math.floor(noise*noiseHeight + gaussHeight*(1-noise)));
                    this.map[i][j] = {type: "building" ,height : height, building : null};


                    // console.log(this.models);
                    //Make Building and add to list of buildings
                    let building = new Building(parent, this.map[i][j].height, this.reclaimerProperties, this.models);
                    this.map[i][j].building = building;
                    this.buildings.push(building);
                    // offset buildings to the centre of the terrain
                    building.createBuilding(i,j, this.citySize);
                    building.updateBuilding();
                }            
            }
        }
    }


    defaults(){
        // var materialsArray = [];

        var material_house = new THREE.MeshPhysicalMaterial();
        var material_apartment = new THREE.MeshPhysicalMaterial();
        var material_skyscraper = new THREE.MeshPhysicalMaterial();
        var material_debug = new THREE.MeshPhysicalMaterial();

        material_house.color =  new THREE.Color( 0xfddb53 );
        material_apartment.color =  new THREE.Color( 0xd67229 );
        material_skyscraper.color =  new THREE.Color( 0xc5c6d0 );
        material_debug.color = new THREE.Color(1, 1, 0);
        // use null value in first element to offset indexes by 1
        // materialsArray.push(null);
        // materialsArray.push(material_house);
        // materialsArray.push(material_apartment);
        // materialsArray.push(material_skyscraper);
        // materialsArray.push(material_debug);

        let materialIndex = Math.min(this.height, 3)
        // this.material = this.materialsArray[materialIndex];

        let objLoader = new OBJLoader();
        // let material = this.material;
        let house = new THREE.Object3D();
        let apart = new THREE.Object3D();
        let sky = new THREE.Object3D();

        // const loader = new GLTFLoader();
        // loader.load('assets/Objects/Buildings/Sky/skyScraper1.gltf', ( model ) => {
        //     // model.scene.material = material_house;
        //     sky.add(model.scene);
        // });
        
        objLoader.load('assets/Objects/Buildings/house1obj.obj', function ( object ){
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material_house;
                    child.castShadow = true;
                    child.recieveShadow = true;
                }
            } );
            house.add(object);
          } );

          objLoader.load('assets/Objects/Buildings/skyScraper1.obj', function ( object ){

            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material_apartment;
                    child.castShadow = true;
                    child.recieveShadow = true;
                }
            } );
            apart.add(object);
          } );

          objLoader.load('assets/Objects/Buildings/skyScraper1.obj', function ( object ){

            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material_skyscraper;
                    child.castShadow = true;
                    child.recieveShadow = true;
                }
            } );
            sky.add(object);
          } );

        this.models.push(house);
        this.models.push(apart);
        this.models.push(sky);
    }


    getBuilding(i, j){ 
        return this.map[i][j].building;
    }

    getRandomTallBuilding(radius){
        //TODO: We have a list of buildings, use that instead of x,y 
        // let b= this.buildings[Math.floor(Math.random() * this.buildings.length)];
        let loops = 0;

        let b = this.buildings[randInt(0, this.buildings.length)]
        console.log(b);

        // generate random coordinates until a tall building is found
        while(b.height < 2){
            
            // after looping 100 times
            if(loops > 100){
                console.log("No tall buildings found")
                // there is likely no tall buildings to find
                // exit loop
                break;
            }
            loops++;
        }

        return b;
    }

    getBuildingsSurrounding(i, j){
        let surrounds = [
            this.getBuilding(i, j + 2),
            this.getBuilding(i + 2, j),
            this.getBuilding(i, j - 2),
            this.getBuilding(i - 2, j)
        ];
        surrounds.forEach(element =>{
            //console.log(element);
            element.colourDebug();
        });
        return surrounds;
    }

    updateBuildings (){
        this.buildings.forEach(element => {
            element.updateBuilding();
        });
    }

    gaussianHeight(size,density, dist){
        let gaussR = gaussian(
                    dist,
                    Math.min((size*size*density)/25.5,10),
                    size/40);
          return gaussR;
    }

    noiseHeight(size, density){
        let noiseHeight = randInt(0, Math.min((size*size*density)/255,20));
        return noiseHeight;
    }
}

  //////////////
  // Gaussian //
  //////////////
  function gaussian(x, a, c) {
    return a * Math.exp(-Math.pow((x) / c, 2));
}