import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { randFloat, randInt, smoothstep } from './MathUtils.js';
import { LandShader } from './Shaders/LandscapeMaterial.js';

export class Landscape {
  size = 0.0;
  cityRadius = 0;
  n = null;

  
  sun = new THREE.Vector3(0, 0, 0);

  octaves = 2;
  persistence = 0.5;
  lacunarity = 2;
  scale = 0.5;
  height = 0.2;
  maxResolution = 400;

  iterations = 3;
  falloff = 0.1;
  

  constructor(size, landVals, sunDirection, reclaimerProperties) {
    this.cityRadius = size * 0.5;
    this.size = size * 10;
    this.n = new ImprovedNoise;
    this.randZ = randFloat(0, 1000);

    this.octaves = landVals.octaves;
    this.persistence = landVals.persistence
    this.lacunarity = landVals.lacunarity;
    this.scale = landVals.scale;
    this.height = landVals.height;
    this.falloff = landVals.falloff; 
    this.iterations = landVals.iterations;
    this.maxResolution = landVals.resolution;
    this.enableFog = landVals.enableFog;

    this.hmax = -100;
    this.hmin = 100;

    this.sun = sunDirection;

    this.sceneProperties = reclaimerProperties;
    this.scene = reclaimerProperties.scene;

    this.material;

      
    var canvasG = document.getElementById("heightgrd");
    canvasG.addEventListener("click", ()=>{
      createGradMap();
    }, false); 
    var gradientMap = new THREE.CanvasTexture(canvasG);
    var ctxG = canvasG.getContext("2d");

    createGradMap();
    function createGradMap() {
      let grd = ctxG.createLinearGradient(0,255, 0, 0);
        //sand
        grd.addColorStop(0.0,'rgb(' + 245 + ',' + 245 + ',' + 150 +')');
        grd.addColorStop(0.33,'rgb(' + 245 + ',' + 245 + ',' + 150 +')');
        //grass
        grd.addColorStop(0.34,'rgb(' + 85 + ',' + 172 + ',' + 65 +')');
        grd.addColorStop(0.93,'rgb(' + 85 + ',' + 172 + ',' + 65 +')');
        //snow
        grd.addColorStop(0.94,'rgb(' + 200 + ',' + 200 + ',' + 200 +')');

      ctxG.fillStyle = grd;
      ctxG.fillRect(0, 0, 64, 256)
      gradientMap.needsUpdate = true;
    }
    this.gradientMap = gradientMap;
  }

  // Path: lanscape.js
  set(x, y, value) {
    this.grid[y * this.width + x] = value;
  }

  // Path: lanscape.js
  get(x, y) {
    return this.grid[y * this.width + x];
  }

  // Returns ring of tiles dist(iteration) from center
  ChunkManager(parent){
    const result = [];
    result.push([0, 0]); // center tile
    for (let i = 0; i <= this.iterations; i++) {
      for (let x = -i; x <= i; x++) {
        for (let y = -i; y <= i; y++) {
          if (Math.abs(x) == i || Math.abs(y) == i) {
            result.push([x, y]);
            parent.add(this.makeChunk(i + 1 * 2, x, y));
          }
        }
      }
    }
    return result;
  }


  makeChunk(ring, offsetX, offsetY){
    //Land
    let landGeom = new THREE.PlaneGeometry(this.size, this.size, this.maxResolution/ring, this.maxResolution/ring);
    let landMaterial = new THREE.ShaderMaterial({ side: THREE.DoubleSide});
    landMaterial.uniforms = LandShader.uniforms
    landMaterial.vertexShader = LandShader.vertexShader;
    landMaterial.fragmentShader = LandShader.fragmentShader;
    landMaterial.uniforms.lightDirection.value = this.sun;
    landMaterial.uniforms.gradientMap.value = this.gradientMap;
    landMaterial.uniforms.size.value = this.size;
    landMaterial.uniforms.enableFog.value = this.enableFog;
    //landMaterial.uniforms.envMap = this.scene.environment; -- Need to figure out pmrem UV Cubemap

    this.material = landMaterial;


    const Land = new THREE.Mesh(landGeom, landMaterial );
    Land.rotation.x = -Math.PI/2;
    //landMaterial.wireframe = true;
    //Land.receiveShadow = true;
    Land.position.setY(0.2)
    Land.position.setX(this.size*offsetX)
    Land.position.setZ(this.size*offsetY)
    let positionAttribute = landGeom.attributes.position;
    Land.name = "Land2";

    this.fbmNoise(Land, offsetX, offsetY);

    for (let i = 0; i < landGeom.attributes.position.count; i++) {
      const height = landGeom.attributes.position.getY(i);
      let u = positionAttribute.getX(i);
      let v = positionAttribute.getY(i);
      landGeom.setAttribute('vertexHeight', new THREE.BufferAttribute(new Float32Array([height], 1)));
    }
    return Land;


  }


  fbmNoise(object, offsetX = 0, offsetY = 0){
    let geometry = object.geometry
    let positionAttribute = geometry.attributes.position;
    let octaves = this.octaves;
    let persistence = this.persistence;

    for (let i = 0 ; i < positionAttribute.count ; i++) {
      let u = positionAttribute.getX(i);
      let v = positionAttribute.getY(i);
      let z = positionAttribute.getZ(i);

      //offset
      u += offsetX * this.size;
      v -= offsetY * this.size;

      //Normalize from -100->100 to 0->1
      let x = (u + 100)/200;
      let y = (v + 100)/200;

      //Get FBM value
      let h = this.fbm(x, y, octaves, persistence);

      //Smooth blend with city radius
      let dist = new THREE.Vector2(u, v).distanceTo(new THREE.Vector2(0,0))
      if (dist > this.cityRadius){
        let distN = (dist - this.size);
        let ramp = smoothstep(dist, (this.cityRadius * 4), this.size/1.2); // adjust the second parameter to change the falloff distance
        h = h*this.height * (ramp*2*this.scale);
        if (dist > this.size){
          h -= (dist - this.size) * this.falloff;
        }
      }
      else { h = 0};

      //Set the new height
      positionAttribute.setZ(i, z + h);

    }
    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;
  }

  fbm(x, y, octaves, persistence) {
    let total = 0.0;
    let frequency = 1.00;
    let amplitude = 1.00;
    let maxValue = 0.00;  // Used for normalizing result to 0.0 - 1.0
    for(let i=0;i<octaves;i++) {
      total += this.n.noise(x * frequency, y * frequency, this.randZ) * amplitude;
      
      maxValue += amplitude;
      
      amplitude *= persistence;
      frequency *= this.lacunarity;
    }
    
    return total/maxValue;
  }

  updateUniforms(landVals){
    this.material.uniforms.enableFog.value = landVals.enableFog;  
  }

}