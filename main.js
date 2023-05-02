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
    let sceneVals = {sceneWidth: 3, sceneLength: 4};

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

    //Beach
    let sandGeom = new THREE.PlaneGeometry(20, 20, 100, 100);
    let sandMaterial = new THREE.MeshPhysicalMaterial({color: new THREE.Color(20,50,10), side: THREE.DoubleSide});
    const sand = new THREE.Mesh(sandGeom, sandMaterial );
    sand.rotation.x = -Math.PI/2.2;
    //sand.castShadow = true;
    //landMaterial.wireframe = true;
    sand.receiveShadow = true;
    sand.position.setY(0.2)
    let positionAttribute = sandGeom.attributes.position;
    sand.name = "Sand";

    

    //Dunes
    let duneGeom = new THREE.PlaneGeometry( 20, 20, 100, 100);
    const dunes = new THREE.Mesh(duneGeom, grassMaterial );
    dunes.rotation.x = -Math.PI/2.66;
    dunes.castShadow = true;
    //landMaterial.wireframe = true;
    dunes.receiveShadow = true;
    dunes.position.set(0,0.5,-7)
    addNoise(dunes, .25, .25, 2.2);
    dunes.name = "Dunes";

    let seaGeom = new THREE.PlaneGeometry(20, 20, 100, 100);
    const seaMaterial = new THREE.MeshPhysicalMaterial({side: THREE.DoubleSide});
    seaMaterial.color = new THREE.Color(0.0, 0.15, 0.4);
    seaMaterial.roughness = 0.0;
    const sea = new THREE.Mesh(seaGeom, seaMaterial);
    //sea.castShadow = true;
    sea.receiveShadow = true;
    sea.rotation.x = -Math.PI/2;
    sea.name = "Sea";
    sea.position.set(0,0,6)
    //addNoise(sea, 0.25, 5, 0.1)


    const fbxLoader = new FBXLoader()
   
    let dynamicObjects = new THREE.Object3D;
    scene.add(dynamicObjects);

    function addLog(pos){
      fbxLoader.load(
        './assets/Objects/Log/Log_2.fbx',
          (object) => {
            object.traverse( function (child){
                if (child instanceof(THREE.Object3D)){
                  if (child.name == "Log2"){
                    let geometry = child.geometry;
                    geometry.computeVertexNormals();
                    geometry.computeBoundingBox();
                    var center = new THREE.Vector3();
                    var size = new THREE.Vector3();
                    geometry.boundingBox.getCenter(center);
                    geometry.boundingBox.getSize(size);
                    var min = geometry.boundingBox.min;
    
                   
         
                    var sca = new THREE.Matrix4();
                    var tra = new THREE.Matrix4();
         
                    var ScaleFact=5/size.length();
                    sca.makeScale(ScaleFact,ScaleFact,ScaleFact);
                    tra.makeTranslation (-center.x,-center.y,-min.z);
                    
                    child.position.set(pos.x, pos.y, pos.z);
                    child.scale.set(4, 4, 4);

                    let xRot = randFloat(0, Math.PI);
                    child.rotation.set(0,xRot,Math.PI/2);
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.name = "Log2";
                    //object.geometry.computeVertexNormals();
                    child.userData = {key: 'isPlaceable', isPlaceable:true};
                    dynamicObjects.add(child)
                };
              }
          })
        });
    }

    function addTree(pos){
      fbxLoader.load(
        './assets/Objects/Tree/Tree_2.fbx',
          (object) => {
              object.traverse( function (child){
                  if (child instanceof(THREE.Object3D)){
                    if (child.name == "Tree2"){
                      let geometry = child.geometry;
                      geometry.computeVertexNormals();
                      geometry.computeBoundingBox();
                      var center = new THREE.Vector3();
                      var size = new THREE.Vector3();
                      geometry.boundingBox.getCenter(center);
                      geometry.boundingBox.getSize(size);
                      var min = geometry.boundingBox.min;
           
                      var sca = new THREE.Matrix4();
                      var tra = new THREE.Matrix4();
           
                      var ScaleFact=5/size.length();
                      sca.makeScale(ScaleFact,ScaleFact,ScaleFact);
                      tra.makeTranslation (-center.x,-center.y,-min.z);               
                      child.scale.set(2, 2, 2);
                      child.position.set(pos.x, pos.y, pos.z);
                      //child.rotation.set(0,Math.PI/2,0);
                      child.castShadow = true;
                      child.receiveShadow = true;
                      child.name = "Tree2";
                      child.userData = {key: 'isPlaceable', isPlaceable:true};
                      dynamicObjects.add(child);
                    };
                  }
              })
    
            }
        );
    
    }


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
  function rotateTexture(texture){

    texture.rotation = 2.2*Math.PI/3;
    texture.center = new THREE.Vector2(0.5, 0.5);
    return texture;
  }

    function addNoise(object, scaleX, scaleY, height){
      let geometry = object.geometry
      let positionAttribute = geometry.attributes.position;


      for (let i = 0 ; i < positionAttribute.count ; i++) {
        //console.log(positionAttribute.getX(i));
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        let dist = new THREE.Vector2(x, y).distanceTo(new THREE.Vector2(0,0))
        let n = new ImprovedNoise;
        let h = n.noise(x * scaleX,y * scaleY, 1);
        h *= height
        //let z = positionAttribute.getZ(i);
        positionAttribute.setZ(i, z+h);
        
      }
      geometry.computeVertexNormals();
      positionAttribute.needsUpdate = true;
    }

    function dynamicNoise(object, offset, scaleX, scaleY, height){
      let geometry = object.geometry
      let positionAttribute = geometry.attributes.position;


      for (let i = 0 ; i < positionAttribute.count ; i++) {
        //console.log(positionAttribute.getX(i));
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        let dist = new THREE.Vector2(x, y).distanceTo(new THREE.Vector2(0,0))
        let n = new ImprovedNoise;
        let h = n.noise((x * scaleX)+offset/200,y-offset/200 * scaleY, 1);
        let h2 = n.noise(((x/5) * scaleX)-offset/200,(y/5)-offset/200 * scaleY, 2);
        h *= height
        //let z = positionAttribute.getZ(i);
        positionAttribute.setZ(i, h+h2);
        
      }
      geometry.computeVertexNormals();
      positionAttribute.needsUpdate = true;
    }

    addNoise(sand, 0.25, 5, 0.15);
    addNoise(sand, 0.5,5,0.2);
    addNoise(sand, 1, 10, 0.1);
    addNoise(dunes, 5,5,0.2);
    addNoise(dunes, 10, 10, 0.1);
    

    function CreateScene()
    {   

      scene.add(sand);
      scene.add(dunes);
      scene.add(sea);
      
      var placeRayCast = new THREE.Raycaster();
      for (let i = 0 ; i < 100 ; i++){
        let x = randFloat(-sceneVals.sceneWidth*20, sceneVals.sceneWidth*20)
        let z = randFloat(-sceneVals.sceneLength*20, sceneVals.sceneLength*20 )
        placeRayCast.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0,-1, 0))
        let intersect = placeRayCast.intersectObjects(scene.children, false);
        if (intersect.length > 0){
          if (intersect[ 0 ].object.name == "Dunes"){
            //console.log("Ray at: " + x + " , " + z + "Hit: " + intersect);
            let pos =intersect[0].point;
            addTree(pos);
          }
        }
      }

      for (let i = 0 ; i < 100 ; i++){
        let x = randFloat(-sceneVals.sceneWidth*20, sceneVals.sceneWidth*20)
        let z = randFloat(-sceneVals.sceneLength*20, sceneVals.sceneLength*20 )
        placeRayCast.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0,-1, 0))
        let intersect = placeRayCast.intersectObjects(scene.children, false);
        if (intersect.length > 0){
          if (intersect[ 0 ].object.name == "Sand"){
            //console.log("Ray at: " + x + " , " + z + "Hit: " + intersect);
            let pos =intersect[0].point;
            addLog(pos);
          }
        }
      }
      
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
  //   GUI
  ////////////

  // let palette = {
  //   color: [0, 10,10]
  // }
  
  gui.add(sceneVals, "sceneWidth", 1, 10, 1).onChange(redrawScene);
  gui.add(sceneVals, "sceneLength", 1, 10, 1).onChange(redrawScene);

  function redrawScene(){
    //console.log(dynamicObjects);
    dynamicObjects.clear();

    sand.scale.set(sceneVals.sceneLength,sceneVals.sceneWidth, 1)
    sea.scale.set(sceneVals.sceneLength,sceneVals.sceneWidth, 1)
    dunes.scale.set(sceneVals.sceneLength,sceneVals.sceneWidth, 1)
    CreateScene();
  }

  //final update loop
  let MyUpdateLoop = function ( )
  {
    //call the render with the scene and the camera
    frame++;
    dynamicNoise(sea, frame, .1, 0.35, 0.5)
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

  var raycaster = new THREE.Raycaster();

  let hasSelected = false;
  let isSelectedObj = false;
  let selectedObj = new THREE.Object3D;

  function onDocumentMouseDown( event ) {
    console.log("casting ray" + " hasSelected");

      var mouse = new THREE.Vector2;
      mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );

      if (hasSelected){
        var intersects = raycaster.intersectObjects( scene.children, false );
      }
      else {var intersects = raycaster.intersectObjects( dynamicObjects.children, false );}
      
      
      if ( intersects.length > 0 ) {
        let object = intersects[0].object;

        //console.log(object);
          if ((intersects[ 0 ].object.userData.isPlaceable == true)&&(!isSelectedObj))
          {
            console.log("Selected!");
            selectedObj = intersects[ 0 ].object
            //console.log(selectedObj.material);
            isSelectedObj = true;
            hasSelected = true;
          }
          if ((intersects[ 0 ].object.name == "Dunes")&&(isSelectedObj))
          {
            var pos=intersects[0].point;
            console.log("Placed!");
            selectedObj.position.x=pos.x;
            selectedObj.position.y=pos.y;
            selectedObj.position.z=pos.z;
            isSelectedObj = false;
            hasSelected = false;
          }
      }
  }

  // when the mouse is clicked, call the given function
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );

  
  //link the resize of the window to the update of the camera
  window.addEventListener( 'resize', MyResize);