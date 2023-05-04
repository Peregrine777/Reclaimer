import * as THREE from 'three';
import { ImprovedNoise } from '../build/math/ImprovedNoise.js';
import { randFloat, randInt } from '../src/MathUtils.js';

export class Landscape {
  size = 0;
  cityRadius = 0;
  n = null;
  

  constructor(size) {
    this.cityRadius = size * 0.5;
    this.size = size * 10;
    this.n = new ImprovedNoise;
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
        let landGeom = new THREE.PlaneGeometry(this.size, this.size, 100, 100);
        let landMaterial = new THREE.MeshPhysicalMaterial({color: new THREE.Color(0.2,0.5,0.1), side: THREE.DoubleSide});
        const Land = new THREE.Mesh(landGeom, landMaterial );
        Land.rotation.x = -Math.PI/2;
        //landMaterial.wireframe = true;
        Land.receiveShadow = true;
        Land.position.setY(0.2)
        let positionAttribute = landGeom.attributes.position;
        Land.name = "Land";

        // this.addNoise(Land, 0.25, 5, 0.10);
        // this.addNoise(Land, 0.50, 5, 0.20);
        // this.addNoise(Land, 5, 5, 0.2);

        this.fbmNoise(Land);


        return Land;
  }


  addNoise(object, scaleX, scaleY, height){
    let geometry = object.geometry
    let positionAttribute = geometry.attributes.position;
    let n = new ImprovedNoise;
    let rand = randFloat(0, 100);
      
    for (let i = 0 ; i < positionAttribute.count ; i++) {
      //console.log(positionAttribute.getX(i));
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
    

      let dist = new THREE.Vector2(x, y).distanceTo(new THREE.Vector2(0,0))
      if (dist > this.cityRadius){
        let h = n.noise(x * scaleX,y * scaleY, rand);
        h *= height*(dist/this.cityRadius);
        //let z = positionAttribute.getZ(i);
        positionAttribute.setZ(i, z+h);
      }
    

      
    }
    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;
  }

  fbmNoise(object){
    let geometry = object.geometry
    let positionAttribute = geometry.attributes.position;
    let octaves = 10;
    let persistence = 0.5;

    for (let i = 0 ; i < positionAttribute.count ; i++) {
      const u = positionAttribute.getX(i);
      const v = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      let x = (u + 100)/200;
      let y = (v + 100)/200;
      // console.log(u, v);

      let h = this.fbm(x, y, octaves, persistence);
      //h *= 100;

      let dist = new THREE.Vector2(u, v).distanceTo(new THREE.Vector2(0,0))
      if (dist > this.cityRadius){
        h *= 100;
      }
      else { h = -10};

      

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
      frequency *= 2;
    }
    
    return total/maxValue;
  }

}