import * as THREE from 'three';
import { ImprovedNoise } from '../build/math/ImprovedNoise.js';

export class Landscape {
  size = 0;

  constructor(size) {
    this.size = size;
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

        this.addNoise(Land, 0.25, 5, 0.15);
        this.addNoise(Land, 0.50, 5, 0.20);
        this.addNoise(Land, 1.00, 10, 0.10);


        return Land;
  }


addNoise(object, scaleX, scaleY, height){
  let geometry = object.geometry
  let positionAttribute = geometry.attributes.position;
  let n = new ImprovedNoise;
    
  for (let i = 0 ; i < positionAttribute.count ; i++) {
    //console.log(positionAttribute.getX(i));
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    let dist = new THREE.Vector2(x, y).distanceTo(new THREE.Vector2(0,0))
    if (dist > this.size/2){
      let h = n.noise(x * scaleX,y * scaleY, 1);
      h *= height
      //let z = positionAttribute.getZ(i);
      positionAttribute.setZ(i, z+h);
    }
   

    
  }
  geometry.computeVertexNormals();
  positionAttribute.needsUpdate = true;
}

}