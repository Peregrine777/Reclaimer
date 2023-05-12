import * as THREE from 'three';
import { Vector3 } from "three";

export const LandShader = {


    uniforms: {
        lightDirection: {value: new Vector3(1.0, 1.0, 1.0)},
        gradientMap: {value: null},
        hmax: {value: null},
        hmin: {value: null},
    },
    vertexShader: /* glsl */`
    uniform vec3 lightDirection;

    out vec3 vNormal;
    out vec3 vPosition;
    out vec2 vUV;

    out vec3 lightVec;

 

    void main() {
        vec4 view_position = modelViewMatrix * vec4(position, 1.0);
        vec4 viewLightPos = viewMatrix * vec4(lightDirection, 1.0);
        lightVec          = normalize(viewMatrix * vec4(lightDirection, 0.0)).xyz;
        gl_Position = projectionMatrix * view_position;

        vNormal = normalMatrix * normal;
        vUV = uv;
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
    }
    
    
    `,
    fragmentShader: /* glsl */`
    uniform vec3 lightColor;
    uniform sampler2D gradientMap;


    in vec3 vNormal;
    in vec3 vPosition;
    in vec3 lightVec;

    void main() {
        float hmax = 35.21;
        float hmin = -27.0;
        //Height based colour
        float hValue = (vPosition.y - hmin) / (hmax - hmin);   
        vec3 col = texture2D(gradientMap, vec2(0, hValue)).rgb;
        vec3 baseColor = vec3(col);
 
        vec3 ambientColor = vec3(0.5, 0.5, 0.5);
        vec3 ambientStrength = ambientColor * baseColor;


        float dProd = dot( vNormal, lightVec );
        dProd=clamp(dProd,0.0,1.0);
        vec3 c = mix(baseColor * dProd, ambientColor, ambientStrength);
        gl_FragColor = vec4( c, 1.0 );
    }
    `
}