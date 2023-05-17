    import * as THREE from 'three';
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
    import * as CANNON from 'cannon-es';
    import CannonDebugger from 'cannon-es-debugger';


    //create the scene
    let scene = new THREE.Scene( );
    let ratio = window.innerWidth/window.innerHeight;
    let frame = 0;
    const worldWidth = 256, worldDepth = 256;
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
    composer.addPass(new UnrealBloomPass({x: screen.width, y:screen.height},2.0,0.0,0.75));
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


    const cannonDebugger = new CannonDebugger(scene, physicsworld, {});

    //Skybox

      //Basic Sky
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        './assets/Skybox/skyrender0005.bmp',
        './assets/Skybox/skyrender0002.bmp',
        './assets/Skybox/skyrender0003.bmp',
        './assets/Skybox/skyrender0004.bmp',
        './assets/Skybox/skyrender0004.bmp',
        './assets/Skybox/skyrender0001.bmp',
      ])

      scene.background = texture;
      scene.environment = texture;


  ////////////
  //   GUI  //
  ////////////

   //Values for the GUI
    let sceneVals = {size: 20, sunHelper: false};
    let landVals = {octaves: 8, persistence: 0.5, lacunarity: 2, scale: 1, height: 100, speed: 0.0005, noiseType: "Perlin", noise: "fbm"};
    let cityVals = {density: 1, isSimulating: false};
  
  
  gui.add(sceneVals, "size", 20, 100, 20).onChange(redrawScene);
    
  let folderLand = gui.addFolder("Landscape");
    folderLand.add(landVals,'octaves', 2, 16, 2).onChange(redrawScene);
    folderLand.add(landVals,'persistence', 0.1, 1, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'lacunarity', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'scale', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'height', 10, 500, 5).onChange(redrawScene);

  let folderHelpers = gui.addFolder("Helpers");
    folderHelpers.add(sceneVals, 'sunHelper', false, true).onChange(redrawScene);

  let folderCity = gui.addFolder("City");
  folderCity.add(cityVals, 'isSimulating', false, true);




  //////////////
  // Materials //
  //////////////


  /////////////
  // Objects //
  ///////////

  let Land = new Landscape(sceneVals.size, landVals).makeLand();
  Land.material.needsUpdate = true;
  Land.castShadow = true;
  Land.receiveShadow = true;

  let cityGenPoint = new THREE.Object3D();
  let cityoffset = -sceneVals.size/2;
  //cityGenPoint.position.set(-sceneVals.size/2,0.5,-sceneVals.size/2);
  scene.add(cityGenPoint);

  let City = new TileMap(sceneVals.size, cityVals, cityoffset);
  City.addBuildings(cityGenPoint, physicsworld);
  let debugBuilding = City.getBuilding(0,0);
  //console.log(debugBuilding);
  //debugBuilding.colourDebug();

  /////////////////////////////////////////////////////////////////////////////////////
  //Example import of fractured cube
  let dynamicObjects = new THREE.Object3D();
  dynamicObjects.position.set(0,5,0);

  let objLoader = new OBJLoader();
  objLoader.load('assets/Objects/fracturedCube.obj', function ( object )
  {
  var material = new THREE.MeshPhongMaterial();
  material.color= new THREE.Color(1,0,0);
  material.wireframe=false;
  material.shininess=100;
  object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
          child.material = material;
      }
  } );

  dynamicObjects.add( object );
  } );

  // logging to show the object structure (for debugging)
  console.log(dynamicObjects);

  dynamicObjects.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
          console.log(child);
      }
  });

  scene.add(dynamicObjects);
  /////////////////////////////////////////////////////////////////////////////////////


  /////////////
  // Lights //
  ///////////

      //ambient Lighting
      let skyColour = new THREE.Color( 1, 1, 1 )
      const ambientLight = new THREE.AmbientLight(skyColour, 0.2);
      //scene.add(ambientLight);

      //Sun
      let sunColour = new THREE.Color(1.0,0.98,0.8)
      const sun = new THREE.SpotLight(sunColour,1);
      let sunHelper = new THREE.SpotLightHelper(sun);
      sunHelper.visible = false;
      scene.add(sunHelper);
      sun.castShadow = true;
      sun.shadow.mapSize = new THREE.Vector2(4096, 4096);
      //sun.shadow.bias = 0.21
      sun.position.set(sceneVals.size*5,55,sceneVals.size*-5);
      sun.lookAt(0,0,1);

      scene.add(sun);

  /////////////////////
  // SceneFunctions //
  /////////////////////

  //Branch test
      function CreateScene()
      {   
        scene.add(Land);
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

    scene.remove(Land);
    //clear building meshes
    cityGenPoint.clear();

    // clear physics world
    let bodies = physicsworld.bodies;
    bodies.forEach(element => {
      physicsworld.removeBody(element);
      physicsworld.step();
    })
    // replace physics plane
    physicsworld.addBody(createGroundBody());

    sun.position.set(sceneVals.size*5,55,sceneVals.size*-5);
    Land = new Landscape(sceneVals.size, landVals).makeLand();
    scene.add(Land);

    let City = new TileMap(sceneVals.size, cityVals, cityGenPoint)
    City.addBuildings(cityGenPoint, physicsworld);

    if (sceneVals.sunHelper == true){
      sunHelper.visible = true;
    }
    else {sunHelper.visible = false}
    CreateScene();
  }

  //set to true to simulate physics

  //final update loop
  let MyUpdateLoop = function ( )
  {
    //call the render with the scene and the camera
    frame++;

    if(cityVals.isSimulating){
      City.updateBuildings();
      physicsworld.fixedStep();
    }
    


    //scene.add(sea);
    cannonDebugger.update();
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
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    composer.render();
  };


  //link the resize of the window to the update of the camera
  window.addEventListener( 'resize', MyResize);