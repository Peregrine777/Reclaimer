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
        const loadManager = new THREE.LoadingManager();
        this.models = [];
        this.house;
        this.numHouseBlocks = 0;
        this.numApartBlocks = 0;
        this.numSkyScraperBlocks = 0;

        
        this.createCity(this.parent);
        this.preloadMeshes(loadManager, this.blocksNeeded);

        loadManager.onLoad = () => {
            this.createBuildings(this.parent);
        }


    }

    createCity(parent){
        
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

                    switch (height){
                        case 0:
                            break;
                        case 1:
                            this.numHouseBlocks += height;
                            break;
                        case 2:
                            this.numApartBlocks += height;
                            break;
                        default :
                            this.numSkyScraperBlocks += height;
                            break;
                    }
                }            
            }
        }
        this.blocksNeeded = {houses: this.numHouseBlocks,
            apartments: this.numApartBlocks,
            skyscrapers: this.numSkyScraperBlocks};
        console.log(this.blocksNeeded);
    }

    createBuildings(){
        for (let i = 0; i < this.citySize; i++) {
            for (let j = 0; j < this.citySize; j++){
                if(this.map[i][j].type == "building" && this.map[i][j].height > 0){
                    console.log("creating: (" + i + ", " + j + ")");
                    let height = this.map[i][j].height;
                    
                    switch (height){
                        case 0:
                            break;
                        case 1:
                            this.numHouseBlocks += height;
                            break;
                        case 2:
                            this.numApartBlocks += height;
                            break;
                        default :
                            this.numSkyScraperBlocks += height;
                            break;
                    }
                    console.log(this.blocksNeeded);
                    
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

    preloadMeshes(loadManager, blocksNeeded){
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

        let objLoader = new OBJLoader(loadManager);
        // let material = this.material;
        let house = new THREE.Object3D();
        let apart = new THREE.Object3D();
        let sky = new THREE.Object3D();

        let house_mesh;
        let apart_mesh;
        let skyScaper_mesh;

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
                    //if ( child.isMesh ) console.log( child.geometry );
                    let geometry = child.geometry;
                    geometry.computeVertexNormals();
                    house_mesh = new THREE.InstancedMesh( geometry, material_house, blocksNeeded.houses );
                    house.add( house_mesh );
                }
            } );
            //house.add(object);
          } );

          objLoader.load('assets/Objects/Buildings/skyScraper1.obj', function ( object ){

            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material_apartment;
                    child.castShadow = true;
                    child.recieveShadow = true;
                    let geometry = child.geometry;
                    geometry.computeVertexNormals();
                    apart_mesh = new THREE.InstancedMesh( geometry, material_apartment, blocksNeeded.apartments );
                    apart.add(apart_mesh);
                }
            } );
            //apart.add(object);
          } );

          objLoader.load('assets/Objects/Buildings/skyScraper1.obj', function ( object ){

            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = material_skyscraper;
                    child.castShadow = true;
                    child.recieveShadow = true;
                    let geometry = child.geometry;
                    geometry.computeVertexNormals();
                    skyScaper_mesh = new THREE.InstancedMesh( geometry, material_apartment, blocksNeeded.skyscrapers);
                    apart.add(skyScaper_mesh);
                }
            } );
            sky.add(object);
          } );

        this.house = house;
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