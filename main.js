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




    import { Landscape } from './src/Landscape.js';
    import { TileMap } from './src/tileMap.js';
    import { Environment } from './src/Environment.js';

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
    //renderer.toneMappingExposure = 1

    ///GUI VALS//
    //Values for the GUI
    let sceneVals = {size: 20, sunHelper: false};
    let landVals = {octaves: 8, persistence: 0.5, lacunarity: 2, scale: 1, height: 100, falloff: 0.1, speed: 0.0005, noiseType: "Perlin", noise: "fbm"};
    let cityVals = {density: 1}

    //Skybox

      //Basic Sky (not used)
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        './assets/Skybox/skyrender0005.bmp',
        './assets/Skybox/skyrender0002.bmp',
        './assets/Skybox/skyrender0003.bmp',
        './assets/Skybox/skyrender0004.bmp',
        './assets/Skybox/skyrender0004.bmp',
        './assets/Skybox/skyrender0001.bmp',
      ])

      //scene.background = texture;
      //scene.environment = texture;



  //////////////
  // Materials //
  //////////////


  /////////////
  // Objects //
  ///////////

    let land = new THREE.Object3D();

    let environment = new Environment(scene, renderer);
      const parameters = {
        elevation: 2,
        azimuth: 180
      };

    let cityGenPoint = new THREE.Object3D();
      cityGenPoint.position.set(-sceneVals.size/2,0.5,-sceneVals.size/2);
      scene.add(cityGenPoint);

    let City = new TileMap(sceneVals.size, cityVals, cityGenPoint)
      City.addBuildings(cityGenPoint);


  /////////////
  // Lights //
  ///////////

      //ambient Lighting
      let skyColour = new THREE.Color(1, 1,1)
      const ambientLight = new THREE.AmbientLight(skyColour, 0.2);
      //scene.add(ambientLight);

      //sunlight
      // let sunColour = new THREE.Color(1.0,0.98,0.8)
      // const sunLight = new THREE.SpotLight(sunColour,1);
      // let sunHelper = new THREE.SpotLightHelper(sunLight);
      // sunHelper.visible = false;
      // scene.add(sunHelper);
      // sunLight.castShadow = true;
      // sunLight.shadow.mapSize = new THREE.Vector2(4096, 4096);
      // //sun.shadow.bias = 0.21
      // sunLight.position.set(sceneVals.size*5,55,sceneVals.size*-5);
      // sunLight.lookAt(0,0,1);


      // const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
      // const theta = THREE.MathUtils.degToRad( parameters.azimuth );
      // let sunPos = new THREE.Vector3();

      // sunPos.setFromSphericalCoords( sceneVals.size*5, phi, theta );
      // sunLight.position.copy( sunPos );
      // scene.add(sunLight);


  /////////////////////
  // SceneFunctions //
  /////////////////////

      function CreateScene()
      {   
        scene.add(land);
        new Landscape(sceneVals.size, landVals).ChunkManager(land);

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

  ////////////
  //   GUI  //
  ////////////
  
  gui.add(sceneVals, "size", 20, 100, 20).onChange(redrawScene);
    
  let folderLand = gui.addFolder("Landscape");
    folderLand.add(landVals,'octaves', 2, 16, 2).onChange(redrawScene);
    folderLand.add(landVals,'persistence', 0.1, 1, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'lacunarity', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'scale', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'height', 10, 500, 5).onChange(redrawScene);
    folderLand.add(landVals,'falloff', -0.5, 0.5, 0.05).onChange(redrawScene);

  const folderSky = gui.addFolder( 'Sky' );
    folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateEnvironment() );
    folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateEnvironment() );
    folderSky.open();

  let folderHelpers = gui.addFolder("Helpers");
    folderHelpers.add(sceneVals, 'sunHelper', false, true).onChange(redrawScene);

  function redrawScene(){

    land.clear();
    cityGenPoint.clear();
    cityGenPoint.position.set(-sceneVals.size/2,0.5,-sceneVals.size/2)

    new Landscape(sceneVals.size, landVals).ChunkManager(land);
    let City = new TileMap(sceneVals.size, cityVals, cityGenPoint)
    City.addBuildings(cityGenPoint);

    // if (sceneVals.sunHelper == true){
    //   sunHelper.visible = true;
    // }
    // else {sunHelper.visible = false}
    CreateScene();
  }
 
  function updateEnvironment(){
      
      // const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
      // const theta = THREE.MathUtils.degToRad( parameters.azimuth );
      // sunPos = new THREE.Vector3();
      // sunPos.setFromSphericalCoords( sceneVals.size*5, phi, theta );
      // sunLight.position.set( sunPos );
  }

  //final update loop
  let MyUpdateLoop = function ( )
  {
    //call the render with the scene and the camera
    frame++;

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
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    composer.render();
  };


  //link the resize of the window to the update of the camera
  window.addEventListener( 'resize', MyResize);