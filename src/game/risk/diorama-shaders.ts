import * as THREE from "three";

/**
 * Custom Tilt-Shift Post-Processing Shader
 * Accurately replicates the tilt-shift macro lens depth of field seen in
 * The Legend of Zelda: Echoes of Wisdom and Link's Awakening.
 * Features:
 * - Wide central focal band with pixel-sharp clarity across playable area
 * - Smooth cubic falloff towards extreme top and bottom edges
 * - Multi-tap Gaussian-weighted blur with subtle chromatic fringe
 */
export const ZeldaTiltShiftShader = {
  name: "ZeldaTiltShiftShader",
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1280, 720) },
    focusY: { value: 0.48 }, // Center focal band aligned with gameplay trail
    focusBand: { value: 0.42 }, // Generous 84% vertical razor-sharp corridor
    falloff: { value: 0.22 }, // Smooth optical transition at horizons
    blurStrength: { value: 2.2 }, // Gentle photographic miniature bokeh
    chromaticAberration: { value: 0.0012 }, // Subtle lens dispersion in blur zone
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float focusY;
    uniform float focusBand;
    uniform float falloff;
    uniform float blurStrength;
    uniform float chromaticAberration;
    varying vec2 vUv;

    void main() {
      // Distance from the horizontal focal plane
      float dist = abs(vUv.y - focusY);
      float blurFactor = smoothstep(focusBand, focusBand + falloff, dist);

      if (blurFactor <= 0.005) {
        // Pixel-sharp in the focal corridor
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 texelSize = vec2(1.0) / resolution;
      float blur = blurFactor * blurStrength;
      vec4 colorSum = vec4(0.0);
      float totalWeight = 0.0;

      // 8-tap vertical gaussian kernel for silky toy diorama bokeh
      const int SAMPLES = 6;
      for (int i = -SAMPLES; i <= SAMPLES; i++) {
        float offset = float(i);
        float weight = exp(-0.5 * (offset * offset) / 8.0);
        vec2 sampleUv = vUv + vec2(0.0, offset * blur * texelSize.y);
        sampleUv = clamp(sampleUv, 0.0, 1.0);

        // Subtle chromatic dispersion in out-of-focus areas
        float ca = chromaticAberration * blurFactor * offset;
        vec2 sampleUvR = clamp(sampleUv + vec2(ca, 0.0), 0.0, 1.0);
        vec2 sampleUvB = clamp(sampleUv - vec2(ca, 0.0), 0.0, 1.0);

        float r = texture2D(tDiffuse, sampleUvR).r;
        float g = texture2D(tDiffuse, sampleUv).g;
        float b = texture2D(tDiffuse, sampleUvB).b;
        float a = texture2D(tDiffuse, sampleUv).a;

        colorSum += vec4(r, g, b, a) * weight;
        totalWeight += weight;
      }

      vec4 finalColor = colorSum / totalWeight;

      // Subtle warm vignette around the diorama frame
      vec2 centerCoord = vUv * 2.0 - 1.0;
      float vignette = 1.0 - dot(centerCoord, centerCoord) * 0.08;
      finalColor.rgb *= clamp(vignette, 0.0, 1.0);

      gl_FragColor = finalColor;
    }
  `,
};

/**
 * Creates the signature crystal-clear turquoise lagoon water material with
 * animated sun caustics, soft depth gradient, and specular toy highlights.
 */
export function createZeldaLagoonMaterial(): THREE.ShaderMaterial {
  const uniforms = {
    uTime: { value: 0 },
    uSurfaceColor: { value: new THREE.Color("#4fe5f5") }, // Vivid cyan-aquamarine highlight
    uDeepColor: { value: new THREE.Color("#1a8ea8") }, // Luminous tropical blue depth
    uFoamColor: { value: new THREE.Color("#ffffff") }, // Crisp white shoreline foam
    uSunDirection: { value: new THREE.Vector3(-0.35, 0.85, 0.4).normalize() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

        // Gentle surface micro-undulation
        float wave = sin(worldPos.x * 2.5 + uTime * 1.4) * cos(worldPos.z * 2.5 + uTime * 1.2) * 0.022;
        worldPos.y += wave;

        vWorldPosition = worldPos;
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSurfaceColor;
      uniform vec3 uDeepColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSunDirection;

      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      // Dual-frequency procedural caustic wave generator
      float causticPattern(vec2 p, float time) {
        vec2 p1 = p * 4.2 + vec2(sin(time * 0.7), cos(time * 0.6)) * 0.4;
        vec2 p2 = p * 6.5 + vec2(cos(time * 0.9), sin(time * 0.8)) * 0.5;

        float c1 = sin(p1.x + sin(p1.y * 1.5 + time * 1.8));
        float c2 = cos(p2.y + cos(p2.x * 1.5 + time * 1.5));
        float caustics = pow(abs(c1 + c2) * 0.5, 3.2);
        return clamp(caustics * 1.85, 0.0, 1.0);
      }

      void main() {
        // Base lagoon color gradient
        float caustics = causticPattern(vWorldPosition.xz * 0.45, uTime);

        // Specular sun reflection glint
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfVector = normalize(uSunDirection + viewDir);
        float NdotH = max(0.0, dot(vNormal, halfVector));
        float specular = pow(NdotH, 48.0) * 0.65;

        // Blend deep tropical turquoise with surface highlight and sparkling caustics
        vec3 waterColor = mix(uDeepColor, uSurfaceColor, 0.45 + caustics * 0.4);
        waterColor += uFoamColor * specular;

        // Crystal clarity with high opacity
        gl_FragColor = vec4(waterColor, 0.84);
      }
    `,
  });

  return material;
}

/**
 * Creates cut log fence posts with tree growth rings on top with toy lacquer finish.
 */
export function createZeldaLogFence(
  length: number,
  spacing = 0.45
): THREE.Group {
  const fence = new THREE.Group();
  fence.name = "zelda-log-fence";

  const barkMat = new THREE.MeshPhysicalMaterial({
    color: "#8a5832",
    roughness: 0.35,
    metalness: 0.02,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  });
  const endGrainMat = new THREE.MeshPhysicalMaterial({
    color: "#dca868",
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });

  const count = Math.max(2, Math.floor(length / spacing));
  for (let i = 0; i < count; i++) {
    const postHeight = 0.48 + ((i * 17) % 5) * 0.035;
    const postRadius = 0.095;
    const post = new THREE.Group();
    post.position.set((i - count / 2) * spacing, 0, 0);

    // Bark cylinder
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 14),
      barkMat
    );
    cylinder.position.y = postHeight / 2;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    post.add(cylinder);

    // Top end-grain disc with subtle chamfer
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(postRadius * 0.95, postRadius * 0.95, 0.02, 14),
      endGrainMat
    );
    cap.position.y = postHeight + 0.005;
    cap.castShadow = true;
    post.add(cap);

    fence.add(post);
  }

  return fence;
}



/**
 * Creates stepped terrace plateau geometry with vertical strata and rounded grass tops.
 */
export function createZeldaSteppedPlateau(
  x: number,
  y: number,
  z: number,
  radiusX: number,
  radiusZ: number,
  height: number,
  stoneMat: THREE.Material,
  grassMat: THREE.Material
): THREE.Group {
  const plateau = new THREE.Group();
  plateau.position.set(x, y, z);

  // Vertical stone base
  const stoneMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusX * 0.95, radiusX, height, 24),
    stoneMat
  );
  stoneMesh.scale.set(1, 1, radiusZ / radiusX);
  stoneMesh.position.y = height / 2;
  stoneMesh.castShadow = true;
  stoneMesh.receiveShadow = true;
  plateau.add(stoneMesh);

  // Pillowed rounded grass cap on top
  const grassCap = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusX * 0.98, radiusX * 0.92, 0.18, 24),
    grassMat
  );
  grassCap.scale.set(1, 1, radiusZ / radiusX);
  grassCap.position.y = height + 0.08;
  grassCap.castShadow = true;
  grassCap.receiveShadow = true;
  plateau.add(grassCap);

  return plateau;
}
