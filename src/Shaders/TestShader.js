import * as THREE from 'three';
import { Vector3 } from "three";

export const TestShader = {


    uniforms: {
        heights
    },
    vertexShader: /* glsl */`
    uniform vec3 lightDirection;

    uniform samplerCube envMap;


    out vec2 vUV;



    void main() {
        gl_Position = projectionMatrix * view_position;

        vUV = uv;
        
    }
    
    
    `,
    fragmentShader: /* glsl */`
    #define PI 3.14159265358979323846
    uniform vec3 lightColor;
    uniform sampler2D gradientMap;
    uniform samplerCube envMap;


    in vec3 vNormal;
    in vec3 vPosition;
    in vec3 lightVec;
    in vec3 vNorm;
    in vec3 vViewNormal;
    in vec3 vViewDirection;
    in vec3 upVec;
    in vec3 vReflect;
    
    void main() {   
        gl_FragColor = vec4(c, 1.0 );
    }
    `
}