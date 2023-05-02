import * as THREE from 'three';

export class Landscape {

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Array(width * height);
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
        let landGeom = new THREE.PlaneGeometry(20, 20, 100, 100);
        let landMaterial = new THREE.MeshPhysicalMaterial({color: new THREE.Color(0.2,0.5,0.1), side: THREE.DoubleSide});
        const Land = new THREE.Mesh(landGeom, landMaterial );
        Land.rotation.x = -Math.PI/2;
        //landMaterial.wireframe = true;
        Land.receiveShadow = true;
        Land.position.setY(0.2)
        let positionAttribute = landGeom.attributes.position;
        Land.name = "Land";
        return Land;
  }
}