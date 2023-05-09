import * as THREE from 'three';

export const LandShader = {
    uniforms: {
        colour: {value:null},
    },
    vertexShader: /* glsl */`


    // Perlin noise function
    float noise(vec2 x) {
      vec2 p = floor(x);
      vec2 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      float n = p.x + p.y * 57.0;
      return mix(mix(fract(sin(n) * 753.5453123), fract(sin(n + 1.0) * 753.5453123), f.x),
                 mix(fract(sin(n + 57.0) * 753.5453123), fract(sin(n + 58.0) * 753.5453123), f.x), f.y);
    }
    
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    }
    `,
    fragmentShader: /* glsl */`
    void main() {
      // Add noise to the water surface
      // float n = noise(vUv * noiseScale + vec2(time * 0.1, time * 0.1));
      // vec3 color = vec3(0.0, 0.3, 0.5) + vec3(n * noiseStrength);
      
      // // Add reflections based on light position
      // vec3 lightDir = normalize(lightPosition - vec3(vUv, 0.0));
      // float reflection = pow(max(dot(lightDir, vec3(0.0, 0.0, 1.0)), 0.0), 10.0);
      // color += vec3(1.0, 1.0, 1.0) * reflection;
      
      gl_FragColor = vec4(vNormal, 1.0);
    }
  `
  }