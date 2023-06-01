import * as THREE from 'three';
import { Vector3 } from "three";

export const BuildingShader = {

    uniforms: {
        lightDirection: {value: new Vector3(1.0, 1.0, 1.0)},
        lightColor: {value: new Vector3(0.8, 0.76, 0.50)},
        baseColor: {value: new Vector3(0.5, 0.5, 0.5)},
        type: {value: 0},
        textureMap: {value: null},
        normalMap: {value: null},
        frame: {value: 0.0},
        roofColor: {value: new Vector3(0.5, 0.5, 0.5)},
    },
    vertexShader: /* glsl */`


    #include <shadowmap_pars_vertex>

    uniform vec3 lightDirection;

    uniform samplerCube envMap;

    out vec3 vNormal;
    out vec3 vPosition;
    out vec3 vEyePosition;
    out vec2 vUv;
    out vec3 lightVec;
    out vec3 upVec;
    out vec3 vNorm;
    out vec3 vViewDirection;
    out vec3 vViewNormal;
    out vec3 vReflect;
    out vec3 viewZ;
    out vec3 vModel;


    void main() {
        vModel = position ;
        vec4 view_position = modelViewMatrix * vec4(position, 1.0);

        vEyePosition = view_position.xyz;
        vec4 viewLightPos = viewMatrix * vec4(lightDirection, 1.0);
        lightVec = normalize(viewMatrix * vec4(lightDirection, 0.0)).xyz;
        upVec    = normalize(viewMatrix * vec4(0., 1., 0.0, 0.0)).xyz;
        gl_Position = projectionMatrix * view_position;

        viewZ = gl_Position.xyz;

        vNormal = normalize(normalMatrix * normal);
        vNorm = normal;
        vec3 view = viewMatrix[3].xyz;
        vViewDirection = normalize(-(modelViewMatrix * vec4(position, 1.0))).xyz;

        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec3 I = worldPosition.xyz - cameraPosition;
        vReflect = reflect( I, vNormal );
        vPosition = (worldPosition).xyz; 
        
        #include <shadowmap_vertex>
    }
    
    
    `,
    fragmentShader: /* glsl */`

    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    
    uniform int type;
    uniform vec3 baseColor;
    uniform sampler2D textureMap;
    uniform sampler2D normalMap;
    uniform float frame;
    uniform vec3 roofColor;
    #define PI 3.14159265358979323846

    in vec3 vNormal;
    in vec3 vPosition;
    in vec3 vEyePosition;
    in vec3 lightVec;
    in vec3 vNorm;
    in vec3 vViewNormal;
    in vec3 vViewDirection;
    in vec3 upVec;
    in vec2 vUv;
    in vec3 vReflect;
    in vec3 viewZ;
    in vec3 vModel;
    

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

    //Meant to correct normal map given surface normals... doesn't work.
    // vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN ) {

	// 	// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

	// 	vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
	// 	vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
	// 	vec2 st0 = dFdx( vUv.st );
	// 	vec2 st1 = dFdy( vUv.st );

	// 	float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude

	// 	vec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );
	// 	vec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );
	// 	vec3 N = normalize( surf_norm );

	// 	mat3 tsn = mat3( S, T, N );

	// 	mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );

	// 	return normalize( tsn * mapN );

	// }


    void main() {
        float hmax = 0.01;
        float hmin = -10.0;

        vec3 lightColor = vec3(0.8, 0.76, 0.50);
        vec3 skyColor = vec3(0.6, 0.62, 0.85);
        vec3 fogColor = vec3(0.6, 0.62, 0.85);
        vec3 apartmentWindowColor = vec3(0.2, 0.2, 0.5);
        vec3 windowColor = vec3(0.7, 0.7, 0.4);

        vec3 shadowColor = vec3(0, 0, 0);
        float shadowPower = 0.5;

        hmin = clamp(hmin + frame,-10.,10.);
        hmax = clamp(hmax + frame,0.0,12.);
        

        //Height based colour
        float hValue = (vPosition.y - hmin) / (hmax - hmin);   
        hValue += noise(vPosition.xz, 155.0) * 0.10 - 0.05;
        hValue = clamp(hValue, 0.0, 1.0);
        // vec3 base = baseColor + texture2D(textureMap, vUv).rgb;
        vec3 base = baseColor * hValue;
        float roof = (1. - step(0.3,vModel.g));
        
        
        if (type == 1){
            base = mix(roofColor, base, roof); 
        }
        else if (type == 2){
            vec2 st = vModel.xz * 4. + 1.5;
            vec2 ipos = floor(st);  // get the integer coords
            vec2 fpos = fract(st);

            vec3 mosaicCol = vec3(mod(ipos.x + ipos.y, 2.0));


            float window = (step(0.01,vModel.g)- step(0.4,vModel.g)) * mosaicCol.g ;
            base = mix(base, apartmentWindowColor, window);
        }
        else if (type == 3){
            vec2 st = vModel.xy * 4. + 1.5;
            vec2 st2 = vModel.xz * 4.;
            
            vec2 ipos = floor(st);  // get the integer coords
            vec2 ipos2 = floor(st2);  // get the integer coords
            vec2 fpos = fract(st);
            vec3 winMos = vec3(vec3(rand( ipos2 )));

            vec3 mosaicCol = vec3(mod(ipos.x + ipos.y,2.0));
            float window = (step(-0.3,vModel.g)- step(0.4,vModel.g)) * mosaicCol.g * winMos.g ;
            base = mix(base, windowColor, window);
            // base = winMos;
        }

        base = mix(base, vec3(0.2,0.2,0.2), (1.-hValue) );
        // vec3 base = vec3(frame, frame, frame);


        //Ambient Lighting
        vec3 ambientColor = vec3(0.35, 0.35, 0.34) * 0.8;
        vec3 ambientStrength = ambientColor * base;

        //Diffuse Lighting
            //direct
            float dProd = dot( vNormal, lightVec );
            dProd=(step(-0.4,dProd)*0.3 - 0.1 ) + step(0.6, dProd);
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
        vec3 directLight = base * directLightColor;
        vec3 directFresnel = mix(directLight, fresnelLight, fresnel);

        vec3 skyLight = base * skyLightColor;
        vec3 ambient = base * 0.1;

        vec3 finalLighting = mix(directFresnel, skyLight, 0.1);

        float fog = viewZ.z/5000.;
        vec3 c = mix(finalLighting, ambientColor, ambientStrength);
        c = mix(c, shadowColor, (1.0 - getShadowMask() ) * shadowPower);

        vec3 finalFog = mix(c, fogColor, fog);
        gl_FragColor = vec4(finalFog ,  1.0 );
    }
    `
}