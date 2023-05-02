      //@ts-check
    import * as THREE from 'three';
    import { OrbitControls } from './build/controls/OrbitControls.js';

    import { ImprovedNoise } from './build/math/ImprovedNoise.js';
    import dat from './build/datGUI.module.js';
    import { randFloat, randInt } from './src/MathUtils.js';
    import {EffectComposer} from "./jsm/postprocessing/EffectComposer.js";
    import {RenderPass} from "./jsm/postprocessing/RenderPass.js";
    import {UnrealBloomPass} from "./jsm/postprocessing/UnrealBloomPass.js";
    import {SSAOPass} from "./jsm/postprocessing/SSAOPass.js";  import { FBXLoader } from './jsm/loaders/FBXLoader.js';
    import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';

    import { Landscape } from './src/landscape.js';

    //create the scene
    let scene = new THREE.Scene( );
    let ratio = window.innerWidth/window.innerHeight;
    let frame = 0;
    const worldWidth = 256, worldDepth = 256;
    let gui = new dat.GUI();

    //create the webgl renderer
    let renderer = new THREE.WebGLRenderer({ antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement );
  
    //camera
    let camera = new THREE.PerspectiveCamera(55,ratio,0.1,1000);
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

    ///SCENEVALUES//
    //Values for the GUI
    let sceneVals = {size: 20};

    //Skybox

      //Basic Sky
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        './assets/Skyboxes/Basic/skyrender0005.bmp',
        './assets/Skyboxes/Basic/skyrender0002.bmp',
        './assets/Skyboxes/Basic/skyrender0003.bmp',
        './assets/Skyboxes/Basic/skyrender0004.bmp',
        './assets/Skyboxes/Basic/skyrender0004.bmp',
        './assets/Skyboxes/Basic/skyrender0001.bmp',
      ])

      scene.background = texture;
      scene.environment = texture;



  //////////////
  // Materials //
  //////////////


  /////////////
  // Objects //
  ///////////

  let Land = new Landscape(sceneVals.size).makeLand();

  /////////////
  // Lights //
  ///////////

      //ambient Lighting
      let skyColour = new THREE.Color(1, 1,1)
      const ambientLight = new THREE.AmbientLight(skyColour, 0.2);
      scene.add(ambientLight);

      //Sun
      let sunColour = new THREE.Color(1.0,0.98,0.8)
      const sun = new THREE.DirectionalLight(sunColour,0.4);
      sun.castShadow = true;
      sun.position.set(15,15,15);
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

  ////////////
  //   GUI  //
  ////////////
  
  gui.add(sceneVals, "size", 20, 100, 20).onChange(redrawScene);

  function redrawScene(){

    scene.remove(Land);
    Land = new Landscape(sceneVals.size).makeLand();
    scene.add(Land);
    CreateScene();
  }

  //final update loop
  let MyUpdateLoop = function ( )
  {
    //call the render with the scene and the camera
    frame++;
    //scene.add(sea);
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