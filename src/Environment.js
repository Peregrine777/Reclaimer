import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

export class Environment{



    constructor (scene, renderer){
        let water;
        let sun;


        sun = new THREE.Vector3();
        const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

        water = new Water(
          waterGeometry,
          {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( '../assets/textures/waternormals.jpg', function ( texture ) {
      
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      
            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
          }
        );
      
        water.rotation.x = - Math.PI / 2;
        water.position.y = -10;
      
        scene.add( water );
      
      
        const sky = new Sky();
        sky.scale.setScalar( 10000 );
        scene.add( sky );
      
        const skyUniforms = sky.material.uniforms;
      
        skyUniforms[ 'turbidity' ].value = 10;
        skyUniforms[ 'rayleigh' ].value = 2;
        skyUniforms[ 'mieCoefficient' ].value = 0.005;
        skyUniforms[ 'mieDirectionalG' ].value = 0.8;
      
        let parameters = {
          elevation: 2,
          azimuth: 180
        };

        this.parameters = parameters;

        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        let renderTarget;

        this.water = water;
        this.sun = sun;
        this.sky = sky;
        this.scene = scene;
        this.renderer = renderer;
        this.parameters = parameters;

        this.updateSun(scene, renderer, parameters);

    }

    updateSun(scene, renderer, parameters) {
        let sun = this.sun;
        let sky = this.sky;
        let water = this.water;
        this.parameters = parameters;

        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        let renderTarget;

        const phi = THREE.MathUtils.degToRad( 90 - this.parameters.elevation );
        const theta = THREE.MathUtils.degToRad( this.parameters.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
        water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

        if ( renderTarget !== undefined ) renderTarget.dispose();

        renderTarget = pmremGenerator.fromScene( sky );
        pmremGenerator.dispose();

        scene.environment = renderTarget.texture;
    }

    update(){
        this.water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    }

}