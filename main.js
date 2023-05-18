    import * as THREE from 'three';
    import * as TWEEN from '/node_modules/@tweenjs/tween.js/dist/tween.esm.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
    import { GUI } from '/node_modules/dat-gui/datGUI.module.js';
    import { randFloat, randInt } from './src/MathUtils.js';
    import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
    import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
    import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
    import {SSAOPass} from "three/addons/postprocessing/SSAOPass.js";   
    import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
    import { Landscape } from './src/landscape.js';
    import { TileMap } from './src/tileMap.js';
    import { Environment } from './src/Environment.js';
    import { Vine } from './src/Vine.js';
    import * as CANNON from 'cannon-es';
    import CannonDebugger from 'cannon-es-debugger';

    document.getElementById("button").addEventListener("click", startReclamation, false); 

    //create the scene
    let scene = new THREE.Scene( );
    let ratio = window.innerWidth/window.innerHeight;
    let totalTime = 0.00;
    let frame = 0;
    let gui = new GUI();

    //create the webgl renderer
    let renderer = new THREE.WebGLRenderer({ antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
   
    document.body.appendChild(renderer.domElement );
  
    //camera
    let camera = new THREE.PerspectiveCamera(55,ratio,0.1,5000);
    camera.position.set(-20,2,16);
    camera.lookAt(0,0,1);
    renderer.setSize(window.innerWidth,window.innerHeight);
    
    //Composition & Rendering
    let composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene,camera));
    composer.addPass(new SSAOPass(scene,camera,0, 0)); 
    composer.addPass(new UnrealBloomPass({x: screen.width, y:screen.height},0.70,0.0,0.85));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1


    // PHYSICS WORLD //
    const physicsworld = new CANNON.World({
      gravity: new CANNON.Vec3(0,-9.82,0),
    });

    function createGroundBody(){
      const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
      });
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      groundBody.position.set(0,0.2,0);
      return groundBody;
    }

    physicsworld.addBody(createGroundBody());


    //const cannonDebugger = new CannonDebugger(scene, physicsworld, {});


  ////////////
  //   GUI  //
  ////////////

   //Values for the GUI
    let sceneVals = {size: 20, sunHelper: false};
    let landVals = {octaves: 8, persistence: 0.5, lacunarity: 2, scale: 1,
      height: 100, falloff: 0.1, speed: 0.0005, noiseType: "Perlin", noise: "fbm"};
    let cityVals = {density: 1, isSimulating: true};
    let envVals = {
      elevation: 2,
      azimuth: 180
    };
  
  
  gui.add(sceneVals, "size", 20, 100, 20).onChange(redrawScene);
    
  let folderLand = gui.addFolder("Landscape");
    folderLand.add(landVals,'octaves', 2, 16, 2).onChange(redrawScene);
    folderLand.add(landVals,'persistence', 0.1, 1, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'lacunarity', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'scale', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'height', 10, 500, 5).onChange(redrawScene);

  let folderCity = gui.addFolder("City");
  folderCity.add(cityVals, 'isSimulating', true, false);


  /////////////
  // Objects //
  ////////////


  let cityGenPoint = new THREE.Object3D();
  let cityoffset = -sceneVals.size/2;
  //cityGenPoint.position.set(-sceneVals.size/2,0.5,-sceneVals.size/2);
  scene.add(cityGenPoint);

  let City = new TileMap(sceneVals.size, cityVals, cityoffset);
  City.addBuildings(cityGenPoint, physicsworld);

  let land = new THREE.Object3D();
  let environment = new Environment(scene, renderer);
  let sunDirection = environment.sun;

  //City.getBuildingsSurrounding(2,2);

  /////////////////////////////////////////////////////////////////////////////////////
  //Example import of fractured cube
  // let dynamicObjects = new THREE.Object3D();
  // dynamicObjects.position.set(0,5,0);

  // let objLoader = new OBJLoader();
  // objLoader.load('assets/Objects/fracturedCube-cubes.obj', function ( object )
  // {
  // var material = new THREE.MeshLambertMaterial();
  // material.color= new THREE.Color(1,0,1);
  // //material.wireframe=true;
  // material.shininess=100;
  // object.traverse( function ( child ) {
  //     if ( child instanceof THREE.Mesh ) {
  //         child.material = material;
  //     }
  // } );

  // dynamicObjects.add( object );
  // } );

  // // logging to show the object structure (for debugging)
  // //console.log(dynamicObjects);

  // dynamicObjects.traverse( function ( child ) {
  //     if ( child instanceof THREE.Mesh ) {
  //         //console.log(child);
  //     }
  // });

  //scene.add(dynamicObjects);

  ////////////
  // Vines //
  ///////////

  //let vine = new Vine();
  //scene.add(vine);

  function verticalVineGrow(vine, height){
    const tween = new TWEEN.Tween({ y: 0.1 })
    .to({y : (1 / 2) * height}, 3000)
    .onUpdate((scale) => {
      //vine.position.y = scale.y;
      vine.scale.y = vine.initialScale * scale.y;
    });

    tween.start();
  }

  function horizontalVineGrow(vine){
    const tween = new TWEEN.Tween({ x: 1 })
    .to({y : 0.7}, 5000)
    .onUpdate((scale) => {
      //vine.position.y = scale.y;
      vine.scale.x = vine.initialScale * scale.x;
      vine.scale.z = vine.initialScale * scale.x;
    });

    tween.start();
  }

  //horizontalVineGrow(vine);
  //verticalVineGrow(vine, 2);

  /////////////////////////////////////////////////////////////////////////////////////


  /////////////
  // Lights //
  ///////////

      //ambient Lighting
      let skyColour = new THREE.Color( 1, 1, 1 )
      const ambientLight = new THREE.AmbientLight(skyColour, 0.2);
      //scene.add(ambientLight);

  /////////////////////
  // SceneFunctions //
  /////////////////////

    let numberOfBuildingTargets = 3;

      function startReclamation(){
        let buildingTargets = pickRandomBuildings(numberOfBuildingTargets);
        let blockTargets = [];
        let vines = [];

        buildingTargets.forEach(building => {
          //console.log(building);
          building.colourDebug();
          building.unfreezeBuilding();

          let block = pickRandomBlock(building);
          block.shatterBlock();
          //blockTargets.push(block);

          let vine = new Vine();
          scene.add(vine);
          let position = building.getPosition();
          position.x -= sceneVals.size / 2;
          position.z -= sceneVals.size / 2;
          console.log(position);
          vine.setPosition(position);
          console.log(vine);
          verticalVineGrow(vine, block.height);
          //vines.push(vine);

        });
      }

      function pickRandomBuildings(numberOfBuildings){
        let buildings = [];
        let i = 0;
        while(i < numberOfBuildings){
          let x = randInt(2, City.cityRadius) * 2 - 2;
          let y = randInt(2, City.cityRadius) * 2 - 2;
          buildings.push(
            City.getBuilding(x, y)
          );
          i++;
        }
        return buildings;
      }

      function pickRandomBlock(building){
        let block = building.getBlock(randInt(0, building.getHeight() - 1));
        return block;
      }

      function CreateScene()
      {   
        scene.add(land);
        new Landscape(sceneVals.size, landVals, sunDirection).ChunkManager(land);
      }
      
      CreateScene();
  
  //////////////
  // CONTROLS //
  //////////////
  
  // move mouse and: left   click to rotate,
  //                 middle click to zoom,
  //                 right  click to pan
  // add the new control and link to the current camera to transform its position
  
  let controls = new OrbitControls( camera, renderer.domElement );
  //let controls = new FirstPersonControls(camera, renderer.domElement);

  function redrawScene(){

    land.clear();
    cityGenPoint.clear();

    // clear physics world
    let bodies = physicsworld.bodies;
    bodies.forEach(element => {
      physicsworld.removeBody(element);
      physicsworld.step();
    })
    // replace physics plane
    physicsworld.addBody(createGroundBody());

    new Landscape(sceneVals.size, landVals).ChunkManager(land);
    let City = new TileMap(sceneVals.size, cityVals, cityGenPoint)
    City.addBuildings(cityGenPoint, physicsworld);

    // if (sceneVals.sunHelper == true){
    //   sunHelper.visible = true;
    // }
    // else {sunHelper.visible = false}
    CreateScene();
  }
 
  function updateEnvironment(){
    environment.updateSun(scene, renderer, envVals);
    // environment.update();
  }

  //final update loop
  let MyUpdateLoop = (t) =>
  {
    //call the render with the scene and the camera
    frame++;

    TWEEN.update(t);

    if(cityVals.isSimulating){
      City.updateBuildings();
      physicsworld.fixedStep();
    }
    
    //scene.add(sea);
    //cannonDebugger.update();
    environment.update();

    composer.render();
    controls.update();
    requestAnimationFrame(MyUpdateLoop);
  };
  
  requestAnimationFrame(MyUpdateLoop);
  
  //this function is called when the window is resized
  let MyResize = function ( )
  {
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width,height);
    composer.setSize(width,height);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    composer.render();
  };


  //link the resize of the window to the update of the camera
  window.addEventListener( 'resize', MyResize);