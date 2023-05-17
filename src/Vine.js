import * as THREE from 'three';

export class Vine extends THREE.Object3D{

    mesh;
    tubularSegments = 20;
    radialSegments = 20;
    closed = true;
    initialScale = 0.1;
    radius = 1;

    constructor(){
        super();
        const curve = new THREE.CatmullRomCurve3( [
            new THREE.Vector3( -10, 0, 10 ),
            new THREE.Vector3( -5, 5, 5 ),
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( 5, -5, 5 ),
            new THREE.Vector3( 10, 0, 10 )
        ] );

        const material = new THREE.MeshPhysicalMaterial();
        material.color = new THREE.Color(0,1,0);
    
        const tube = new THREE.TubeGeometry(curve, this.tubularSegments, this.radius, this.radialSegments, this.closed);
        this.mesh = new THREE.Mesh(tube, material);
        this.setScale(this.initialScale, this.initialScale * 4, this.initialScale);
        this.add(this.mesh);
    }

    setScale(x, y, z){
        this.mesh.scale.set(x,y,z);
    }
}