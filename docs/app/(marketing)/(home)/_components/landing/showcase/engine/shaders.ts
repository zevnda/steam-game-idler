// Custom materials for the 3D stage. Everything glowy is a cheap additive shader rather than a
// post-processing bloom pass - bloom would also smear the UI's white text/buttons on the app's
// screen, and an EffectComposer drops the renderer's MSAA, which the screen's small text needs.

import * as THREE from 'three'

/**
 * Additive light for a transparent canvas. A stock AdditiveBlending material adds its full alpha,
 * which turned every glow quad into an opaque black rectangle over the page behind the canvas.
 * Here each fragment adds premultiplied light plus only as much alpha as its brightest channel
 * (`validGlow`), so empty glow stays see-through and lit pixels stay valid premultiplied colour.
 */
function glowBlend<T extends THREE.ShaderMaterial>(mat: T) {
  mat.blending = THREE.CustomBlending
  mat.blendEquation = THREE.AddEquation
  mat.blendSrc = THREE.OneFactor
  mat.blendDst = THREE.OneFactor
  mat.blendSrcAlpha = THREE.OneFactor
  mat.blendDstAlpha = THREE.OneFactor
  return mat
}

const HSL = /* glsl */ `
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }
`

/** Premultiplied light whose alpha is its brightest channel - a valid premultiplied colour, so
 *  the compositor never sees rgb > alpha (which some GPU paths render as bright artifacts). */
const VALID_GLOW = /* glsl */ `
  vec4 validGlow(vec3 c) {
    return vec4(c, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
  }
`

const ROUND_RECT = /* glsl */ `
  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
`

/**
 * Soft glow halo behind the window - the docs hero's slowly rotating, muted (36% saturation)
 * rainbow conic border (HeroCopy's RainbowBadge), blurred out into light.
 */
export function rimMaterial(winW: number, winH: number, pad: number) {
  return glowBlend(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.55 },
        uHalf: { value: new THREE.Vector2(winW / 2, winH / 2) },
        uSize: { value: new THREE.Vector2(winW + pad * 2, winH + pad * 2) },
      },
      vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: /* glsl */ `
      ${VALID_GLOW}
      uniform float uTime;
      uniform float uIntensity;
      uniform vec2 uHalf;
      uniform vec2 uSize;
      varying vec2 vUv;
      ${HSL}
      ${ROUND_RECT}
      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        float d = sdRoundRect(p, uHalf, 0.06);
        float glow = exp(-max(d, 0.0) * 5.5) * smoothstep(-0.25, 0.02, d);
        // -atan: hue runs clockwise on screen (red at the right, purple at the top, cyan at the
        // left), so the visible top edge opens blue -> purple. Must match the hero placeholder's
        // conic-gradient (.hero-ph::before in globals.css) or the hand-over flashes colours.
        float hue = fract(-atan(p.y, p.x) / 6.2831853 + uTime * 0.035);
        vec3 col = hsl2rgb(vec3(hue, 0.36, 0.55));
        gl_FragColor = validGlow(col * glow * uIntensity);
      }
    `,
      transparent: true,
      depthWrite: false,
    }),
  )
}

/**
 * A faint glass reflection streak across the screen that slides as the window turns, so the
 * flat UI reads as a physical pane of glass.
 */
export function sheenMaterial() {
  return glowBlend(
    new THREE.ShaderMaterial({
      uniforms: { uShift: { value: 0 }, uStrength: { value: 0.07 } },
      vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: /* glsl */ `
      ${VALID_GLOW}
      uniform float uShift;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float s = vUv.x * 0.8 + vUv.y * 0.55 - uShift;
        float band = exp(-pow((s - 0.55) * 7.0, 2.0)) + 0.45 * exp(-pow((s - 0.78) * 16.0, 2.0));
        float edge = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x)
                   * smoothstep(0.0, 0.03, vUv.y) * smoothstep(1.0, 0.97, vUv.y);
        gl_FragColor = validGlow(vec3(band * uStrength * edge));
      }
    `,
      transparent: true,
      depthWrite: false,
    }),
  )
}

/** Pulsing rounded-rect outline that hovers over the control a passive visitor should try. */
export function beaconMaterial(color: THREE.Color) {
  return glowBlend(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
        uHalf: { value: new THREE.Vector2(0.4, 0.1) },
        uRadius: { value: 0.1 },
        uColor: { value: color },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: /* glsl */ `
      ${VALID_GLOW}
      uniform float uTime;
      uniform vec2 uSize;
      uniform vec2 uHalf;
      uniform float uRadius;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      ${ROUND_RECT}
      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        float d = sdRoundRect(p, uHalf, uRadius);
        float a = 0.0;
        // two staggered rings expanding outward from the control's edge
        for (int i = 0; i < 2; i++) {
          float ph = fract(uTime * 0.7 + float(i) * 0.5);
          float r = ph * 0.11;
          a += smoothstep(0.012, 0.0, abs(d - r)) * (1.0 - ph);
        }
        a += smoothstep(0.01, 0.0, abs(d - 0.004)) * 0.6;
        gl_FragColor = validGlow(uColor * a * uOpacity);
      }
    `,
      transparent: true,
      depthWrite: false,
    }),
  )
}

/** Ambient dust drifting through the god rays; animated entirely on the GPU. */
export function dustMaterial(pixelRatio: number) {
  return glowBlend(
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uOpacity: { value: 1 } },
      vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.11 + aSeed * 6.0) * 0.35;
        p.y += mod(uTime * (0.03 + aSeed * 0.05) + aSeed * 9.0, 9.0) - 4.5;
        p.z += cos(uTime * 0.09 + aSeed * 4.0) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // about one in seven motes is a little larger, so the field has some depth
        float big = step(0.86, fract(aSeed * 7.31)) * 1.1;
        gl_PointSize = (2.0 + aSeed * 4.0) * (1.0 + big) * uPixelRatio * (6.0 / -mv.z);
        vAlpha = (0.15 + 0.35 * fract(aSeed * 13.7)) * (0.6 + 0.4 * sin(uTime * 0.8 + aSeed * 20.0));
      }
    `,
      fragmentShader: /* glsl */ `
      ${VALID_GLOW}
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = validGlow(vec3(smoothstep(0.5, 0.0, d) * vAlpha * uOpacity));
      }
    `,
      transparent: true,
      depthWrite: false,
    }),
  )
}

/** Glowing spark particles (achievement bursts, card catches); CPU-simulated, GPU-drawn. */
export function sparkMaterial(pixelRatio: number) {
  return glowBlend(
    new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: pixelRatio } },
      vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      attribute float aSize;
      attribute float aAlpha;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (8.0 / -mv.z);
        vAlpha = aAlpha;
        vColor = aColor;
      }
    `,
      fragmentShader: /* glsl */ `
      ${VALID_GLOW}
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        gl_FragColor = validGlow(vColor * (0.6 + core) * core * core * vAlpha);
      }
    `,
      transparent: true,
      depthWrite: false,
    }),
  )
}

/** Expanding ring on the screen surface when an achievement unlocks. */
export function shockwaveMaterial() {
  return glowBlend(
    new THREE.ShaderMaterial({
      uniforms: { uProgress: { value: 0 }, uColor: { value: new THREE.Color('#ffd36b') } },
      vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: /* glsl */ `
      ${VALID_GLOW}
      uniform float uProgress;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float r = uProgress;
        float ring = smoothstep(0.08, 0.0, abs(d - r)) * (1.0 - uProgress);
        float fill = smoothstep(r, 0.0, d) * 0.25 * (1.0 - uProgress);
        gl_FragColor = validGlow(uColor * (ring + fill));
      }
    `,
      transparent: true,
      depthWrite: false,
    }),
  )
}
