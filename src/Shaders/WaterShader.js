import * as THREE from 'three';

export const WaterShader = {
    uniforms: {
        colour: {value:null},
        time: {value: 0.0 },
        resolution: { value: new THREE.Vector2() },
        lightPosition: { value: new THREE.Vector3() },
        sunColor: { value: new THREE.Color(0xffffff) },
        noiseScale: { value: 0.3 },
        noiseStrength: { value: 0.6 },
        amplitude: { value: 1 },
        frequency: { value: new THREE.Vector2(4, 8) }
    },
    vertexShader: `

    uniform float time;
    uniform float noiseScale;
    uniform float noiseStrength;
    uniform float amplitude;
    uniform vec2 frequency;

    out vec3 vNormal;
    out vec3 vPosition;
    out vec2 vUv;

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
      vUv = uv;
      
      // Add waves to the water surface based on a height map
      vec3 pos = position;
      float n = noise(vUv * noiseScale + vec2(time * 0.1, time * 0.1));
      float height = sin(pos.x * frequency.x + time * 2.0) * amplitude * n;
      pos.z += height*2.550;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      vNormal = normal;
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    }
    `,
    fragmentShader: `

    uniform float time;
    uniform float noiseScale;
    uniform float noiseStrength;
    uniform vec3 lightPosition;

    in vec3 vNormal;
    in vec3 vPosition;
    
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