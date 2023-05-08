import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { randFloat, randInt, smoothstep } from '../src/MathUtils.js';

export class Landscape {
  size = 0;
  cityRadius = 0;
  n = null;
  


  octaves = 2;
  persistence = 0.5;
  lacunarity = 2;
  scale = 0.5;
  height = 0.2;
  maxResolution = 500;
  iterations = 3;
  

  constructor(size, landVals) {
    this.cityRadius = size * 0.5;
    this.size = size * 10;
    this.n = new ImprovedNoise;

    this.octaves = landVals.octaves;
    this.persistence = landVals.persistence
    this.lacunarity = landVals.lacunarity;
    this.scale = landVals.scale;
    this.height = landVals.height;
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
            console.log(x, y);
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
    let landMaterial = new THREE.MeshPhysicalMaterial({color: new THREE.Color(0.2,0.5,0.1), side: THREE.DoubleSide});
    const Land = new THREE.Mesh(landGeom, landMaterial );
    Land.rotation.x = -Math.PI/2;
    //landMaterial.wireframe = true;
    Land.receiveShadow = true;
    Land.position.setY(0.2)
    Land.position.setX(this.size*offsetX)
    Land.position.setZ(this.size*offsetY)
    let positionAttribute = landGeom.attributes.position;
    Land.name = "Land2";

    this.fbmNoise(Land, offsetX, offsetY);
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
        let distN = (dist - this.cityRadius) / (this.size - this.cityRadius);
        let ramp = smoothstep(dist, this.cityRadius, this.size); // adjust the second parameter to change the falloff distance
        h = h*this.height * (ramp*2*this.scale);
        if (dist > this.size){
          h -= (dist - this.size) * 0.1;
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
      total += this.n.noise(x * frequency, y * frequency, 0.1) * amplitude;
      
      maxValue += amplitude;
      
      amplitude *= persistence;
      frequency *= this.lacunarity;
    }
    
    return total/maxValue;
  }

}