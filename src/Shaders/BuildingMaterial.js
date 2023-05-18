import * as THREE from 'three';
import { Vector3 } from "three";

export const BuildingShader = {


    uniforms: {
        lightDirection: {value: new Vector3(1.0, 1.0, 1.0)},
        lightColor: {value: new Vector3(0.8, 0.76, 0.50)},
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
    out vec3 upVec;
    out vec3 vNorm;
    out vec3 vViewDirection;
    out vec3 vViewNormal;


    void main() {
        vec4 view_position = modelViewMatrix * vec4(position, 1.0);
        vec4 viewLightPos = viewMatrix * vec4(lightDirection, 1.0);
        lightVec = normalize(viewMatrix * vec4(lightDirection, 0.0)).xyz;
        upVec    = normalize(viewMatrix * vec4(0., 1., 0.0, 0.0)).xyz;
        gl_Position = projectionMatrix * view_position;

        vNormal = normalize(normalMatrix * normal);
        vNorm = ((normal) * -1.0);
        vec3 view = viewMatrix[3].xyz;
        vViewDirection = normalize(-(modelViewMatrix * vec4(position, 1.0))).xyz;

        vUV = uv;
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
    }
    
    
    `,
    fragmentShader: /* glsl */`
    #define PI 3.14159265358979323846
    uniform vec3 lightColor;
    uniform sampler2D gradientMap;


    in vec3 vNormal;
    in vec3 vPosition;
    in vec3 lightVec;
    in vec3 vNorm;
    in vec3 vViewNormal;
    in vec3 vViewDirection;
    in vec3 upVec;
    

    float rand (vec2 st) {
        return fract(sin(dot(st.xy,
                                vec2(12.9898,78.233)))
                    * 4.5453123);
    }

    float noise(vec2 p, float freq ){
        float unit = 1080.0/freq;
        vec2 ij = floor(p/unit);
        vec2 xy = mod(p,unit)/unit;
        //xy = 3.*xy*xy-2.*xy*xy*xy;
        xy = .5*(1.-cos(PI*xy));
        float a = rand((ij+vec2(0.,0.)));
        float b = rand((ij+vec2(1.,0.)));
        float c = rand((ij+vec2(0.,1.)));
        float d = rand((ij+vec2(1.,1.)));
        float x1 = mix(a, b, xy.x);
        float x2 = mix(c, d, xy.x);
        return mix(x1, x2, xy.y);
    }

    // float plot(vec2 st, float pct){
    //     return  smoothstep( pct-0.02, pct, st.y) -
    //             smoothstep( pct, pct+0.02, st.y);
    //   }


    void main() {

        vec3 cliffColor = vec3(0.3, 0.3, 0.3);
        vec3 flatColor = vec3(0.7, 0.75, 0.0);
        vec3 skyColor = vec3(0.6, 0.62, 0.85);

        //Height based colour
        float hValue = (vPosition.y - hmin) / (hmax - hmin);   
        hValue += noise(vPosition.xz, 155.0) * 0.30 - 0.15;
        vec3 col = texture2D(gradientMap, vec2(0, hValue)).rgb;
        vec3 baseColor = vec3(col);

        //Gradient Based color 
        float flats = pow(clamp((1. - (abs(vNorm.x) + abs(vNorm.y) + abs(vNorm.z)) *1. + 1.0),0.,1.),5.0);
        vec3 flatC = flatColor * flats;
        float slopes = pow(clamp(( (abs(vNorm.x) + abs(vNorm.y) + abs(vNorm.z)) *1. - 1.0),0.,1.),5.0);
        vec3 slopeC = cliffColor * slopes;

        vec3 landColor = (baseColor + flatC) * (1.- slopeC);

        //Ambient Lighting
        vec3 ambientColor = vec3(0.25, 0.25, 0.254) * 0.75;
        vec3 ambientStrength = ambientColor * baseColor;

        //Diffuse Lighting
            //direct
            float dProd = dot( vNormal, lightVec );
            dProd=(step(-0.4,dProd)*0.5 - 0.1 ) + step(0.6, dProd);
            dProd=clamp(dProd,0.,1.0);

            //sky
            float aLight = dot( vNormal, upVec );
            aLight=(step(-0.0,aLight)*0.5 - 0.1 ) + step(0.81, aLight);
            aLight=clamp(aLight,0.,1.0);

        //final lights
        vec3 directLightColor = lightColor * dProd;
        vec3 skyLightColor = skyColor * aLight;

        //pseudo fresnel
        float fresnel =  dot(vNormal, vViewDirection);
        fresnel = clamp(pow(1.0 - fresnel, 7.), 0.0, 1.0);
        vec3 fresnelLight = fresnel * skyLightColor;

        //final colour
        vec3 directLight = landColor * directLightColor;
        vec3 directFresnel = mix(directLight, fresnelLight, fresnel);

        vec3 skyLight = landColor * skyLightColor;
        vec3 ambient = landColor* baseColor;

        vec3 finalLighting = mix(directFresnel, skyLight, 0.1);


        
        vec3 c = mix(finalLighting, ambientColor, ambientStrength);
        gl_FragColor = vec4(c, 1.0 );
    }
    `
}