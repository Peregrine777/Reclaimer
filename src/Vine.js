import * as THREE from 'three';
import * as TWEEN from '/node_modules/@tweenjs/tween.js/dist/tween.esm.js';

export class Vine extends THREE.Object3D{

    mesh;
    tubularSegments = 10;
    radialSegments = 10;
    closed = false;
    initialScale = 0.7;
    radius = 0.2;

    constructor(){
        super();
        let points = [];
        let c = 0;
        while (c <= 10){
            points.push(new THREE.Vector3(
                Math.sin(5 * c),
                c,
                Math.cos(5 * c)
                ));
                c += 0.1;
        }

        const curve = new THREE.CatmullRomCurve3(points);

        const material = new THREE.MeshPhysicalMaterial({wireframe : false});
        material.color = new THREE.Color(0,1,0);
        const tube = new THREE.TubeGeometry(curve, this.tubularSegments, this.radius, this.radialSegments, this.closed);
        this.mesh = new THREE.Mesh(tube, material);
        this.setScaleUniform(this.initialScale);
        this.add(this.mesh);
        this.setScaleVertical(0.1);
    }

    setScaleUniform(scale){
        this.mesh.scale.set(scale, scale, scale);
    }

    setScaleVertical(scale){
        scale *= this.initialScale;
        let matrix = new THREE.Matrix4().makeScale(1, scale, 1);
        this.applyMatrix4(matrix);
    }

    setHcaleHorizontal(scale){
        scale *= this.initialScale;
        let matrix = new THREE.Matrix4().makeScale(scale, 1, scale );
        this.applyMatrix4(matrix);
    }

    setPosition(position = new THREE.Vector3(0,0,0)){
        this.position.setX(position.x);
        this.position.setY(position.y);
        this.position.setZ(position.z);
    }

    
    growVine(targetHeight){

        const verticalGrow = new TWEEN.Tween({ y: 0.1 })
        .to({y : targetHeight / 2}, 4000)
        .onUpdate((scale) => {
          this.scale.y = this.initialScale * scale.y;
        })
        .easing(TWEEN.Easing.Elastic.InOut);
      
        const horizontalShrink = new TWEEN.Tween({ x: 1 })
        .to({y : 0.5}, 5000)
        .onUpdate((scale) => {
          this.scale.x = this.initialScale * scale.x;
          this.scale.z = this.initialScale * scale.x;
        })
        .delay(500)
        .easing(TWEEN.Easing.Cubic.InOut);
        //.onComplete(block.shatterBlock());
    
        verticalGrow.chain(horizontalShrink);
    
        verticalGrow.start();
      }
}