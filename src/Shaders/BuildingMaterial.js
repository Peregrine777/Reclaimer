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

    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 permute(vec4 x) {
           return mod289(((x*34.0)+1.0)*x);
      }
      
      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }
      
      float snoise(vec3 v)
        {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
      
      // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
      
        //   x0 = x0 - 0.0 + 0.0 * C.xxx;
        //   x1 = x0 - i1  + 1.0 * C.xxx;
        //   x2 = x0 - i2  + 2.0 * C.xxx;
        //   x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
      
      // Permutations
        i = mod289(i);
        vec4 p = permute( permute( permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      
      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;
      
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
      
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
      
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
      
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
      
        //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
        //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
      
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
      
      //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
      
      // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                      dot(p2,x2), dot(p3,x3) ) );
        }


    void main() {
        float hmax = 0.01;
        float hmin = -10.0;

        vec3 lightColor = vec3(0.8, 0.76, 0.50);
        vec3 skyColor = vec3(0.6, 0.62, 0.85);
        vec3 fogColor = vec3(0.6, 0.62, 0.85);
        vec3 apartmentWindowColor = vec3(0.2, 0.2, 0.5);
        vec3 windowColor = vec3(0.7, 0.7, 0.4);
        vec3 mud1  = vec3(0.2, 0.5, 0.1);
        vec3 mud2 = vec3(0.06, 0.12, 0.05);



        hmin = clamp(hmin + frame,-10.,7.);
        hmax = clamp(hmax + frame,0.0,12.);
        

        //Height based colour
        float hValue = (vPosition.y - hmin) / (hmax - hmin);   
        hValue += noise(vPosition.xz, 155.0) * 0.10 - 0.05;
        hValue = clamp(hValue, 0.0, 1.0);
        // vec3 base = baseColor + texture2D(textureMap, vUv).rgb;
        vec3 base = baseColor * hValue;
        float roof = (1. - step(0.3,vModel.g));

        vec3 mud = mix(mud1, mud2, snoise(vPosition*3.));
        
        
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

            float window = 0.0;

            vec3 mosaicCol = vec3(mod(ipos.x + ipos.y,2.0));
            if (frame == 0.){
                window = (step(-0.3,vModel.g)- step(0.4,vModel.g)) * mosaicCol.g * winMos.g ;
            }
            
            base = mix(base, windowColor, window);
            // base = winMos;
        }

        base = mix(base, (base * 0.5) + (mud * 0.5), (1.- hValue));
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

        vec3 finalFog = mix(c, fogColor, fog);
        gl_FragColor = vec4(finalFog ,  1.0 );
    }
    `
}