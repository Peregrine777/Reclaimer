import * as THREE from 'three';
import { Vector3 } from "three";

export const LandShader = {


    uniforms: {
        lightDirection: {value: new Vector3(1.0, 1.0, 1.0)},
        lightColor: {value: new Vector3(0.8, 0.76, 0.50)},
        gradientMap: {value: null},
        size: {value: 20.0},
        hmax: {value: null},
        hmin: {value: null},
        envMap: {value: null},
        vpw: {value: 0.00005},
        vph: {value: 0.00005},
        offset: {value: new THREE.Vector2(-0.5,-0.5)},
        pitch: {value: new THREE.Vector2(4, 4)},
        enableFog: {value: true},
        heightMap: {value: new THREE.DataTexture(new Uint8Array(1), 1, 1, THREE.RGBAFormat)},
        hmMin: {value: 0.0},
        hmMax: {value: 0.0},
        heightMapRes: {value: 400.0}
    },
    vertexShader: /* glsl */`
    uniform vec3 lightDirection;

    uniform samplerCube envMap;

    out vec3 vNormal;
    out vec3 vPosition;
    out vec2 vUV;
    out vec3 lightVec;
    out vec3 upVec;
    out vec3 vNorm;
    out vec3 vViewDirection;
    out vec3 vViewNormal;
    out vec3 vReflect;
    out vec3 viewZ;


    void main() {
        vec4 view_position = modelViewMatrix * vec4(position, 1.0);
        vec4 viewLightPos = viewMatrix * vec4(lightDirection, 1.0);
        lightVec = normalize(viewMatrix * vec4(lightDirection, 0.0)).xyz;
        upVec    = normalize(viewMatrix * vec4(0., 1., 0.0, 0.0)).xyz;
        gl_Position = projectionMatrix * view_position;

        viewZ = gl_Position.xyz;

        vNormal = normalize(normalMatrix * normal);
        vNorm = ((normal) * -1.0);
        vec3 view = viewMatrix[3].xyz;
        vViewDirection = normalize(-(modelViewMatrix * vec4(position, 1.0))).xyz;

        vUV = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec3 I = worldPosition.xyz - cameraPosition;
        vReflect = reflect( I, vNormal );
        vPosition = (worldPosition).xyz;     
    }
    
    
    `,
    fragmentShader: /* glsl */`
    #define PI 3.14159265358979323846
    uniform vec3 lightColor;
    uniform vec3 lightDirection;
    uniform sampler2D gradientMap;
    uniform samplerCube envMap;
    uniform float size;
    uniform bool enableFog;
    uniform sampler2D heightMap;
    uniform float hmMin;
    uniform float hmMax;
    uniform float heightMapRes;

    uniform float vpw; // Width, in pixels
    uniform float vph; // Height, in pixels

    uniform vec2 offset; // e.g. [-0.023500000000000434 0.9794000000000017], currently the same as the x/y offset in the mvMatrix
    uniform vec2 pitch;  // e.g. [50 50]


    in vec3 vNormal;
    in vec3 vPosition;
    in vec3 lightVec;
    in vec3 vNorm;
    in vec3 vViewNormal;
    in vec3 vViewDirection;
    in vec3 upVec;
    in vec2 vUV;
    in vec3 vReflect;
    in vec3 viewZ;
    

    float rand (vec2 st) {
        return fract(sin(dot(st.xy,
                                vec2(12.9898,78.233)))
                    * 4.5453123);
    }

    float random (vec2 st) {
        return fract(sin(dot(st.xy,
                             vec2(12.9898,78.233)))*
            43758.5453123);
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

    float getHeightInterpolated(vec2 UVPos){
        float res = heightMapRes;
        vec2 pixelPos = UVPos * res;
        vec2 lerpP = fract(pixelPos);
        pixelPos = floor(pixelPos);
        vec2 corner = pixelPos / res;

        float tl = texture2D(heightMap, corner).r;
        float tr = texture2D(heightMap, corner + vec2(1.0, 0.0) / res).r;
        float bl = texture2D(heightMap, corner + vec2(0.0, 1.0) / res).r;
        float br = texture2D(heightMap, corner + vec2(1.0, 1.0) / res).r;

        float top = mix(tl, tr, lerpP.x);
        float bottom = mix(bl, br, lerpP.x);

        return mix(top, bottom, lerpP.y);
    }

    // float plot(vec2 st, float pct){
    //     return  smoothstep( pct-0.02, pct, st.y) -
    //             smoothstep( pct, pct+0.02, st.y);
    //   }


    void main() {
        float hmax = 35.21;
        float hmin = -27.0;

        vec3 cliffColor = vec3(0.3, 0.3, 0.3);
        vec3 flatColor = vec3(0.7, 0.75, 0.0);
        vec3 skyColor = vec3(0.6, 0.62, 0.85);
        vec3 fogColor = vec3(0.6, 0.62, 0.85);

        //Height based colour
        float hValue = (vPosition.y - hmin) / (hmax - hmin);   
        hValue += noise(vPosition.xz, 55.0) * 0.10 - 0.05;
        vec3 col = texture2D(gradientMap, vec2(0, hValue)).rgb;
        vec3 baseColor = vec3(col);

        //Gradient Based color 
        float flats = pow(clamp((1. - (abs(vNorm.x) + abs(vNorm.y) + abs(vNorm.z)) *1. + 1.0),0.,1.),5.0);
        vec3 flatC = flatColor * flats;
        float slopes = pow(clamp(( (abs(vNorm.x) + abs(vNorm.y) + abs(vNorm.z)) *1. - 1.0),0.,1.),5.0);
        vec3 slopeC = cliffColor * slopes;

        vec3 landColor = (baseColor + flatC) * (1.- slopeC);

        //Road Color
        //Building Location/Height
        
        float citySize = size/9.;
        float distCenter = 1./distance(vPosition.xz, vec2(0.0, 0.0));
        distCenter = step(0.5,distCenter * citySize);
        float angle = (abs(atan(vPosition.x, vPosition.z)))/(2. *PI);
        //Angle Placeholder
        float distMod = angle * 0.01;  
        //
        float distCutoff = step(0.05, distCenter - distMod);
        float negHeight = clamp(step(-8.,vPosition.y), -1.,10.);
        float vertHeight = (1./distance(vPosition.y, 0.0))*02.3;

        vec2 st = vPosition.xz*0.1 + offset;
        vec2 ipos = floor(st);  // get the integer coords
        vec2 fpos = fract(st);

        vec3 mosaicCol = step(0.02,vec3(random( ipos )) * (distCenter));
        

        vec3 buildable = vec3(negHeight * distCenter * distCutoff, vertHeight * distCenter * negHeight * distCutoff, 0.0);
        float scaleFactor = 00001.0;
        float offX = (scaleFactor * offset[0]) + vPosition.x;
        float offY = (scaleFactor * offset[1]) + vPosition.z;
        float roadCol = 0.0;
        if (int(mod(offX, pitch[0])) == 0 ||
        int(mod(offY, pitch[1])) == 0) {
            roadCol = 1.;
            } else {
            roadCol = 0.0;
            }

        //roadColour * area where road can be built
        float roads = roadCol * step(0.05,( buildable.r));

        landColor = landColor * (1. - roads);


        //Ambient Lighting
        vec3 ambientColor = vec3(0.35, 0.35, 0.34) * 0.8;
        vec3 ambientStrength = ambientColor * baseColor;

        //Diffuse Lighting
            //direct
            float dProd = dot( vNormal, lightVec );
            dProd=(step(-0.4,dProd)*0.3 - 0.1 ) + step(0.2, dProd);
            dProd=clamp(dProd,0.,1.0);
  

            //sky
            float aLight = dot( vNormal, upVec );
            aLight=(step(-0.0,aLight)*0.5 - 0.1 ) + step(0.81, aLight);
            aLight=clamp(aLight,0.,1.0);

        //vec3 envColor = textureCube( envMap, vec3( -vReflect.x, vReflect.yz ) ).rgb;

        //final lights
        vec3 directLightColor = lightColor * dProd;
        vec3 skyLightColor = skyColor * aLight;
        
        //Shadows
        int Steps = 10 ;
        float heightMapH = getHeightInterpolated(vUV);
        //get width of texture2D heightmap
        vec3 p = vec3(vUV, heightMapH);
        vec3 lightDir = normalize(lightDirection);
        lightDir = vec3(lightDir.x, -lightDir.z, lightDir.y);
        vec3 stepDir = normalize(lightDir);
        float stepDist = 0.01;
        float inShadow = 0.0;
        float h = p.z + 0.05;
        if (dProd > 0.0){
            for (int i = 0; i < Steps; i++) {
                p += stepDir * max(stepDist, (p.z - h) * 0.05);
                //if p.x or p.y are outside the texture, break
                if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) {
                    break;
                }
                float h = getHeightInterpolated(p.xy);
                //expand h to real range using the min/max heights of the heightmap
                //h = h/255.0;
                //h = mix(hmMin, hmMax, h);
                if (p.z < h) {
                    inShadow = 1.0;
                    break;
                }
                if (p.z > 1.0){
                    break;
                }
            }
        }


        vec3 debugShadow = (1.0 - inShadow) * vec3(0.3, 0.3, 0.3);



        //pseudo fresnel
        float fresnel =  dot(vNormal, vViewDirection);
        fresnel = clamp(pow(1.0 - fresnel, 7.), 0.0, 1.0);
        vec3 fresnelLight = fresnel * skyLightColor;

        //final colour
        vec3 directLight = landColor * directLightColor;
        directLight = mix(directLight , landColor * 0.1, inShadow);
        vec3 directFresnel = mix(directLight, fresnelLight, fresnel);

        vec3 skyLight = landColor * skyLightColor;
        vec3 ambient = landColor* 0.1;

        vec3 finalLighting = mix(directFresnel, skyLight, 0.1);

        float fog = viewZ.z/5000.;
        
        vec3 c = mix(finalLighting, ambientColor, ambientStrength);

        vec3 finalFog = c;
        if (enableFog){
            finalFog = mix(c, fogColor, fog);
        }

        //Get heightMapColor at corresponding position
        vec3 heightMapColor = texture2D(heightMap, vUV).rgb;

        gl_FragColor = vec4(finalFog, 1.0 );
    }
    `
}