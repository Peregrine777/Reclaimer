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
    import { Landscape } from './src/Landscape.js';
    import { City } from './src/City.js';
    import { Environment } from './src/Environment.js';
    import { Vine } from './src/Vine.js';
    import * as CANNON from 'cannon-es';
    import CannonDebugger from 'cannon-es-debugger';

    document.getElementById("button").addEventListener("click", startReclamation, false); 

    //create the scene
    let scene = new THREE.Scene( );
    let ratio = window.innerWidth/window.innerHeight;
    let frame = 0;
    let reclaimFrame = 0;
    let isReclaiming = false;
    let gui = new GUI();



    //create the webgl renderer
    let renderCanvas = document.getElementById("render");
    let renderer = new THREE.WebGLRenderer({ antialias: true, canvas: renderCanvas } );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    let heightGradient = document.getElementById("heightgrd");

    // let fragCanvas = document.getElementById("fragCanvas");
    // var renderer2 = new THREE.WebGLRenderer({canvas: fragCanvas});
    // renderer2.setSize(fragCanvas.width, fragCanvas.height);

    // var renderTarget = new THREE.WebGLRenderTarget(fragCanvas.style.width, fragCanvas.style.height);
    // renderTarget.texture.format = THREE.RGBFormat;

    // let testShader = new THREE.MeshPhongMaterial();

    // let inset_scene = new THREE.Scene();
    // let planeGeom = new THREE.PlaneGeometry(2,2, 20, 20);

    // let plane = new THREE.Mesh(planeGeom, testShader);
    // inset_scene.add(plane);
    // let orthoCam = new THREE.OrthographicCamera();
    // inset_scene.add(orthoCam);
    
    // renderer2.render(inset_scene, orthoCam)

  
  
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
    let uiVals = {HeightTexture: true};
  
  
  gui.add(sceneVals, "size", 20, 100, 20).onChange(redrawScene);
    
  let folderLand = gui.addFolder("Landscape");
    folderLand.add(landVals,'octaves', 2, 16, 2).onChange(redrawScene);
    folderLand.add(landVals,'persistence', 0.1, 1, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'lacunarity', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'scale', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'height', 10, 500, 5).onChange(redrawScene);

  let folderCity = gui.addFolder("City");
  folderCity.add(cityVals, 'isSimulating', true, false);

  const folderSky = gui.addFolder( 'Sky' );
  folderSky.add( envVals, 'elevation', 0, 90, 0.1 ).onChange( updateEnvironment );
  folderSky.add( envVals, 'azimuth', - 180, 180, 0.1 ).onChange( updateEnvironment );
  folderSky.open();

  const folderUI = gui.addFolder( 'UI' );
  folderUI.add( uiVals, 'HeightTexture' ).onChange( updateUI );
  folderUI.open();

  function updateUI(){
    if(uiVals.HeightTexture == false){
      heightGradient.style.visibility = "hidden";
    }
    else { heightGradient.style.visibility = "visible";}
  };
  
  /////////////
  // Objects //
  ////////////

  let environment = new Environment(scene, renderer);
  let sunDirection = environment.sun;

  // Scene Properties
  let reclaimerProperties = {scene, physicsworld, environment, sunDirection, frame, reclaimFrame};

  let cityGenPoint = new THREE.Object3D();
  //cityGenPoint.position.set(-sceneVals.size/2,0.5,-sceneVals.size/2);
  scene.add(cityGenPoint);
    
  let land = new THREE.Object3D();
  land.name = "land";
  scene.add(land);
  new Landscape(sceneVals.size, landVals, sunDirection, reclaimerProperties).ChunkManager(land);

  reclaimerProperties.land = land;

  let city = new City(cityGenPoint,sceneVals.size, reclaimerProperties);
  // city.addBuildings(cityGenPoint);




  //City.getBuildingsSurrounding(2,2);

  ////////////
  // Vines //
  ///////////

  function growVine(vine, targetHeight, block){

    const verticalGrow = new TWEEN.Tween({ y: 0.1 })
    .to({y : targetHeight / 2}, 4000)
    .onUpdate((scale) => {
      vine.scale.y = vine.initialScale * scale.y;
    })
    .easing(TWEEN.Easing.Elastic.InOut);
  
    const horizontalShrink = new TWEEN.Tween({ x: 1 })
    .to({y : 0.5}, 5000)
    .onUpdate((scale) => {
      vine.scale.x = vine.initialScale * scale.x;
      vine.scale.z = vine.initialScale * scale.x;
    })
    .delay(500)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onComplete(block.shatterBlock());

    const verticalShrink = new TWEEN.Tween({y : targetHeight / 2})
    .to({y : 0.5}, 3000)
    .onUpdate((scale) => {
      vine.scale.y = vine.initialScale * scale.y;
    })
    .delay(500)
    .easing(TWEEN.Easing.Cubic.InOut);

    verticalGrow.chain(horizontalShrink);
    //horizontalShrink.chain(verticalShrink);

    verticalGrow.start();
  }

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
        isReclaiming = true;
        reclaimerProperties.reclaimFrame = reclaimerProperties.frame;
        let buildingTargets = pickRandomBuildings(numberOfBuildingTargets);
        //let blockTargets = [];
        //let vines = [];
        console.log(reclaimerProperties.frame);
        console.log(reclaimerProperties.reclaimFrame);
        reclaimerProperties.reclaimFrame = reclaimFrame;
        buildingTargets.forEach(building => {
          //console.log(building);
          building.colourDebug();
          building.unfreezeBuilding();

          let block = pickRandomBlock(building);
          //block.shatterBlock();
          //blockTargets.push(block);

          let vine = new Vine();
          scene.add(vine);
          let position = building.getPosition();
          position.x -= sceneVals.size / 2;
          position.z -= sceneVals.size / 2;
          vine.setPosition(position);
          growVine(vine, block.height / 2, block);
          //vines.push(vine);
        });
      }

      function pickRandomBuildings(numberOfBuildings){
        let buildings = [];
        let i = 0;
        while(i < numberOfBuildings){
          let building = city.getRandomTallBuilding(city.citySize);
          // while(buildings.includes(building) && buildings.size != sceneVals.size * sceneVals.size){
          //   building = City.getRandomTallBuilding(City.cityRadius);
          // }
          buildings.push(building);
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

    new Landscape(sceneVals.size, landVals, sunDirection, reclaimerProperties).ChunkManager(land);
    let city = new City(cityGenPoint, sceneVals.size, reclaimerProperties)

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
    reclaimerProperties.frame += 0.01;
    if (isReclaiming == true){
      reclaimerProperties.reclaimFrame += 0.01;
    }
    frame += 0.01;
 
    TWEEN.update(t);

    

    if(cityVals.isSimulating){
      city.updateBuildings();
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