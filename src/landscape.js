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

  makeLand(){
        //Land
        let landGeom = new THREE.PlaneGeometry(this.size, this.size, 1000, 1000);
        let landMaterial = new THREE.MeshPhysicalMaterial({color: new THREE.Color(0.2,0.5,0.1), side: THREE.DoubleSide});
        const Land = new THREE.Mesh(landGeom, landMaterial );
        Land.rotation.x = -Math.PI/2;
        //landMaterial.wireframe = true;
        Land.receiveShadow = true;
        Land.position.setY(0.2)
        let positionAttribute = landGeom.attributes.position;
        Land.name = "Land";

        this.fbmNoise(Land);
        return Land;
  }



  fbmNoise(object){
    let geometry = object.geometry
    let positionAttribute = geometry.attributes.position;
    let octaves = this.octaves;
    let persistence = this.persistence;

    for (let i = 0 ; i < positionAttribute.count ; i++) {
      const u = positionAttribute.getX(i);
      const v = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      //Normalize from -100->100 to 0->1
      let x = (u + 100)/200;
      let y = (v + 100)/200;

      //Get FBM value
      let h = this.fbm(x, y, octaves, persistence);

      //Smooth blend with city radius
      let dist = new THREE.Vector2(u, v).distanceTo(new THREE.Vector2(0,0))
      if (dist > this.cityRadius){
        let ramp = smoothstep(dist, this.cityRadius, this.size); // adjust the second parameter to change the falloff distance
        h = h*this.height * (ramp*2*this.scale);
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