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
    import { BuildingShader } from './src/Shaders/BuildingMaterial.js';

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
  
    //camera
    let cameraVals = {FOV: 55};
    let camera = new THREE.PerspectiveCamera(cameraVals.FOV,ratio,0.1,5000);
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
      quatNormalizeFast: true,
      quatNormalizeSkip: 8,
    });
    // physicsworld.solver.iterations = 10;
    // physicsworld.defaultContactMaterial.contactEquationRelaxation = 2;

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

  /////////////
  // Objects //
  ////////////

  let sceneVals = {size: 20, sunHelper: false};
  let landVals = {octaves: 8, persistence: 0.5, lacunarity: 2, scale: 1,
    height: 100, falloff: 0.1, speed: 0.0005, noiseType: "Perlin", noise: "fbm"};
  let cityVals = {density: 1, isSimulating: true};
  let envVals = {
    elevation: 2,
    azimuth: 180
  };
  let uiVals = {HeightTexture: true};

  let environment = new Environment(scene, renderer);
  let sunDirection = environment.sun;

  let materialsArray = [];

  // Scene Properties
  let reclaimerProperties = {scene, physicsworld, environment, sunDirection, frame, reclaimFrame, materialsArray};

  let cityGenPoint = new THREE.Object3D();
  //cityGenPoint.position.set(-sceneVals.size/2,0.5,-sceneVals.size/2);
  scene.add(cityGenPoint);
    
  let land = new THREE.Object3D();
  land.name = "land";
  scene.add(land);
  new Landscape(sceneVals.size, landVals, sunDirection, reclaimerProperties).ChunkManager(land);

  reclaimerProperties.land = land;


  //////////////////////
  // SHADER MATERIALS //
  //////////////////////
  let skyscraperColor = new THREE.Color( 0.25, 0.25, 0.5 );
  let skyscraperTexture = new THREE.TextureLoader().load( 'assets/Textures/GlassWindow/Glass_Window_003_basecolor.jpg' );
  let skyscraperNormal = new THREE.TextureLoader().load( 'assets/Textures/GlassWindow/Glass_Window_003_normal.jpg' );
  
  let apartmentColor = new THREE.Color( 0xd67229 );
  let apartmentTexture = new THREE.TextureLoader().load( 'assets/Textures/Bricks/Brick_Wall_019_basecolor.jpg' );
  // let apartmentNormal = new THREE.TextureLoader().load( 'assets/Textures/Bricks/Brick_Wall_019_normal.jpg' );
  let houseColor = new THREE.Color( 0xfddb53 );
  let roofColor = new THREE.Color( 0.9, 0.05, 0.05 );


  let skyScraperMaterial = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge( [
          THREE.UniformsLib[ 'fog' ]] ),});
  skyScraperMaterial.uniforms = {
      lightDirection: {value: reclaimerProperties.sunDirection},
      baseColor: {value: skyscraperColor},
      textureMap: {value: skyscraperTexture},
      normalMap: {value: skyscraperNormal},
      frame: {value: reclaimerProperties.scene.frame},
      type: {value: 3},
      roofColor: {value: roofColor},
  };


  skyScraperMaterial.vertexShader = BuildingShader.vertexShader;
  skyScraperMaterial.fragmentShader = BuildingShader.fragmentShader;

  skyScraperMaterial.needsUpdate = true;

  let apartmentMaterial = skyScraperMaterial.clone();
    apartmentMaterial.uniforms.baseColor.value = apartmentColor;
    apartmentMaterial.uniforms.textureMap.value = apartmentTexture;
    apartmentMaterial.uniforms.type.value = 2;

  let houseMaterial = skyScraperMaterial.clone();
    houseMaterial.uniforms.baseColor.value = houseColor;
    houseMaterial.uniforms.textureMap.value = null;
    houseMaterial.uniforms.type.value = 1;

  let debugMaterial = skyScraperMaterial.clone();
    debugMaterial.uniforms.baseColor.value = new THREE.Color(1, 1, 0);

  reclaimerProperties.materialsArray.push(null);
  reclaimerProperties.materialsArray.push(houseMaterial);
  reclaimerProperties.materialsArray.push(apartmentMaterial);
  reclaimerProperties.materialsArray.push(skyScraperMaterial);
  reclaimerProperties.materialsArray.push(debugMaterial);


  ///////////////////
  // CITY CREATION //
  ///////////////////

  let city = new City(cityGenPoint,sceneVals.size, reclaimerProperties);

  ////////////
  //   GUI  //
  ////////////

   //Values for the GUI

  gui.add(sceneVals, "size", 5, 20, 1).onChange(redrawScene);
  gui.add(cameraVals, "FOV", 20, 90, 1).onChange(function(value){camera.fov = value; camera.updateProjectionMatrix();});
    
  let folderLand = gui.addFolder("Landscape");
    folderLand.add(landVals,'octaves', 2, 16, 2).onChange(redrawScene);
    folderLand.add(landVals,'persistence', 0.1, 1, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'lacunarity', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'scale', 0.1, 4, 0.1).onChange(redrawScene);
    folderLand.add(landVals,'height', 10, 500, 5).onChange(redrawScene);

  let folderCity = gui.addFolder("City");
  folderCity.add(cityVals, 'isSimulating', true, false);

  let paletteSky = {
    SkyScraper: skyscraperColor
  }

  let paletteApart = {
    Apartment: apartmentColor
  }

  let paletteHouse = {
    House: houseColor
  }

  let paletteRoof = {
    Roof: roofColor
  }

  folderCity.addColor(paletteSky, 'SkyScraper').onChange(function(value){
    skyScraperMaterial.uniforms.baseColor.value = new THREE.Color( value.r /255, value.g /255, value.b /255 );
  })

  folderCity.addColor(paletteApart, 'Apartment').onChange(function(value){
    apartmentMaterial.uniforms.baseColor.value = new THREE.Color( value.r /255, value.g /255, value.b /255 );
  })

  folderCity.addColor(paletteHouse, 'House').onChange(function(value){
    houseMaterial.uniforms.baseColor.value = new THREE.Color( value.r /255, value.g /255, value.b /255 );
  })

  folderCity.addColor(paletteRoof, 'Roof').onChange(function(value){
    houseMaterial.uniforms.roofColor.value = new THREE.Color( value.r /255, value.g /255, value.b /255 );
  })

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


  /////////////////////
  // SceneFunctions //
  /////////////////////



  let numberOfBuildingTargets = city.getBuildingsCount();
  console.log(numberOfBuildingTargets);

  function startReclamation(){
    if (isReclaiming == false){
      isReclaiming = true;
      reclaimerProperties.reclaimFrame += 0.01;
      console.log("reclaiming");
    }
    


    let buildingTargets = city.getRandomBuildings(numberOfBuildingTargets);

    let timeout = 0;

    buildingTargets.forEach(building => {

      setTimeout(() => {
      building.unfreezeBuilding();

      let block = building.getRandomBlock();
      block.shatterBlock();

      let vine = new Vine();
      scene.add(vine);
      let position = building.getBlock(0).position;
      //position.x -= sceneVals.size / 2;
      //position.z -= sceneVals.size / 2;
      vine.setPosition(position);
        vine.growVine(building.height / 2);
      },
      timeout);

      timeout += 500;
      //vines.push(vine);
    });

    //console.log(vines);
  }

  //////////////
  // CONTROLS //
  //////////////
  
  // add the new control and link to the current camera to transform its position
  let controls = new OrbitControls( camera, renderer.domElement );

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
    city = new City(cityGenPoint, sceneVals.size, reclaimerProperties)
  }
 
  function updateEnvironment(){
    environment.updateSun(scene, renderer, envVals);
    // environment.update();
  }

  //final update loop
  let MyUpdateLoop = (t) =>
  {
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