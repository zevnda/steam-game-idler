import type { HolidayKey } from './holidays'
import type { ThemePreset } from './presets'

// Fragment shaders for the signature presets' animated backdrops, drawn by `ThemeAmbient.tsx` as
// one full-screen quad behind the dashboard. Deliberately raw WebGL1/GLSL ES 1.0 rather than
// three.js: a backdrop is a single fragment shader with two uniforms, and a scene graph/renderer
// library would be ~150KB of bundle for none of its actual features. WebGL1 (not 2) so the oldest
// WebKitGTK builds Linux users run still get it.
//
// Output contract: a dark preset's shader ends in `emit(color)`, which writes *premultiplied*
// alpha (alpha = the brightest channel). The canvas is transparent and the page's own solid
// `bg-background` layer sits underneath, so a shader only ever paints light *onto* the theme's
// token canvas - it never has to know or duplicate the token colors itself. A light preset (Sugar
// Cloud) can't add light to a near-white canvas, so it ends in `paint(color, alpha)` and lays down
// its own opaque sky instead.
//
// Readability budget: the backdrop shows through wherever the page has no opaque card - including
// directly under page headings - so every shader keeps its brightest regions dim (roughly <= 0.4
// per channel) away from the screen edges. Tune intensity, not a scrim, if one reads too loud.

const PRELUDE = `
precision highp float;
uniform vec2 u_res;   // canvas size in device pixels
uniform float u_px;   // device pixels per CSS pixel (resolution scale)
uniform float u_time; // seconds, wrapped by ThemeAmbient so float precision never degrades

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

// Sparse twinkling point stars on a jittered grid - \`density\` is the fraction of cells lit.
float stars(vec2 p, float scale, float density) {
  vec2 g = p * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  if (h < 1.0 - density) return 0.0;
  vec2 offset = (vec2(hash(id + 1.7), hash(id + 3.1)) - 0.5) * 0.6;
  float d = length(f - offset);
  float twinkle = 0.55 + 0.45 * sin(u_time * (1.0 + h * 3.0) + h * 60.0);
  return smoothstep(0.09, 0.0, d) * twinkle;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

void emit(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}

// Light presets only - see the output contract above.
void paint(vec3 c, float a) {
  gl_FragColor = vec4(clamp(c, 0.0, 1.0) * a, a);
}
`

// Outrun sunset: a striped sun sinking into a neon perspective grid that scrolls toward the viewer.
const SYNTHWAVE = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);
  float horizon = 0.17;
  vec3 col = vec3(0.0);

  // Sky glow, warm at the horizon fading to magenta.
  if (uv.y > horizon) {
    float h = uv.y - horizon;
    col += mix(vec3(0.85, 0.3, 0.25), vec3(0.45, 0.08, 0.4), smoothstep(0.0, 0.35, h))
      * exp(-h * 4.0) * 0.35;
    col += vec3(0.8, 0.7, 1.0) * stars(p, 40.0, 0.06) * smoothstep(0.3, 0.8, uv.y) * 0.5;
  }

  // Sun - stripe cuts widen toward its base and drift downward.
  vec2 center = vec2(0.0, horizon + 0.07);
  float r = 0.13;
  float d = length(p - center);
  float sy = (p.y - center.y) / r;
  float cut = sy < 0.15 ? step(fract(sy * 7.0 + u_time * 0.25), mix(0.08, 0.6, clamp(-sy, 0.0, 1.0))) : 0.0;
  float sun = smoothstep(r, r - 0.004, d) * (1.0 - cut) * step(horizon, uv.y);
  col += mix(vec3(1.0, 0.25, 0.55), vec3(1.0, 0.78, 0.3), sy * 0.5 + 0.5) * sun * 0.26;
  col += vec3(1.0, 0.3, 0.6) * exp(-max(d - r, 0.0) * 9.0) * 0.12 * step(horizon, uv.y);

  // Floor grid in perspective below the horizon. Line width is in grid units, so it scales with
  // depth z to stay roughly constant on screen, fading out where lines converge at the horizon.
  if (uv.y < horizon) {
    float y = horizon - uv.y;
    float z = 0.3 / y;
    vec2 g = abs(fract(vec2(p.x * z * 3.0, z * 1.5 + u_time * 0.6)) - 0.5);
    float lw = 0.012 * z;
    float grid = max(smoothstep(0.5 - lw, 0.5, g.x), smoothstep(0.5 - lw * 1.4, 0.5, g.y));
    float fade = smoothstep(0.0, 0.08, y);
    col += mix(vec3(1.0, 0.2, 0.7), vec3(0.25, 0.75, 1.0), smoothstep(0.0, horizon, y)) * grid * fade * 0.4;
    col += vec3(0.9, 0.2, 0.6) * exp(-y * 25.0) * 0.3;
  }

  emit(col);
}
`

// Northern lights: three fbm-warped curtains with vertical ray streaks, over a sparse starfield.
const AURORA = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec3 col = vec3(0.0);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = uv.x * aspect * (1.0 + fi * 0.35) + fi * 3.7;
    float band = 0.58 + fi * 0.09 + (fbm(vec2(x * 0.7, u_time * 0.04 + fi * 5.0)) - 0.5) * 0.4;
    float d = uv.y - band;
    float curtain = d > 0.0 ? exp(-d * 3.2) : exp(d * 28.0);
    float streak = noise(vec2(x * 14.0, u_time * 0.15 + fi));
    curtain *= 0.35 + 0.9 * streak;
    vec3 base = mix(vec3(0.15, 1.0, 0.55), vec3(0.2, 0.75, 1.0), fi * 0.45);
    vec3 c = mix(base, vec3(0.6, 0.3, 1.0), smoothstep(0.02, 0.3, d));
    col += c * curtain * (0.3 - fi * 0.07);
  }

  vec2 p = vec2(uv.x * aspect, uv.y);
  col += vec3(0.85, 0.9, 1.0) * stars(p, 45.0, 0.07) * 0.45;
  col *= smoothstep(0.05, 0.45, uv.y);
  emit(col);
}
`

// Deep space: domain-warped fbm gas clouds (Inigo Quilez's warp pattern) plus two star depths.
const NEBULA = `
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.015;
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.4 + 3.5 * q + vec2(1.7, 9.2) + t * 1.5),
                fbm(p * 1.4 + 3.5 * q + vec2(8.3, 2.8)));
  float f = fbm(p * 1.4 + 3.5 * r);

  // Hue and density come from different warp stages so color regions don't just track brightness.
  vec3 hue = mix(vec3(0.5, 0.12, 0.7), vec3(0.15, 0.3, 0.9), smoothstep(0.35, 0.7, q.y));
  hue = mix(hue, vec3(1.0, 0.3, 0.55), smoothstep(0.5, 0.72, q.x));
  hue = mix(hue, vec3(0.25, 0.85, 0.95), smoothstep(0.55, 0.8, r.y) * 0.6);
  float density = smoothstep(0.3, 0.85, f);
  vec3 col = hue * (density * 0.5 + pow(f, 3.0) * 0.6);

  col += vec3(0.9, 0.9, 1.0) * stars(p, 28.0, 0.05) * 0.55;
  col += vec3(0.7, 0.8, 1.0) * stars(p + 7.3, 60.0, 0.08) * 0.3;
  emit(col);
}
`

// Digital rain: blocky glyph columns falling at per-column speeds, with CRT scanlines + vignette.
// Measured in CSS pixels (via u_px) so the glyph grid stays crisp at any resolution scale.
const TERMINAL = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 fc = gl_FragCoord.xy / u_px;
  vec2 cell = vec2(12.0, 16.0);
  vec2 id = floor(fc / cell);
  vec2 f = fract(fc / cell);
  float rows = u_res.y / u_px / cell.y;

  float seed = hash(vec2(id.x, 7.0));
  float speed = 3.0 + seed * 7.0;
  float trail = 10.0 + seed * 18.0;
  float span = rows + trail;
  float travel = u_time * speed + seed * 400.0;
  float pass = floor(travel / span);
  float head = mod(travel, span);
  float dist = head - (rows - id.y);
  float active = step(0.55, hash(vec2(id.x, pass)));
  float inten = (dist >= 0.0 && dist < trail) ? pow(1.0 - dist / trail, 1.6) : 0.0;

  vec2 gf = (f - vec2(0.17, 0.12)) / vec2(0.66, 0.76);
  float inside = step(0.0, gf.x) * step(gf.x, 1.0) * step(0.0, gf.y) * step(gf.y, 1.0);
  vec2 bitId = floor(gf * vec2(3.0, 5.0));
  float flip = floor(u_time * (1.5 + seed * 3.0) + hash(id) * 10.0);
  float glyph = inside * step(0.45, hash(id * 1.31 + bitId * 7.13 + flip));

  vec3 col = vec3(0.25, 1.0, 0.45) * glyph * inten * active * 0.32;
  col += vec3(0.75, 1.0, 0.8) * glyph * active * step(0.0, dist) * step(dist, 1.0) * 0.3;

  col += vec3(0.05, 0.35, 0.12) * (1.0 - smoothstep(0.2, 0.9, length(uv - 0.5))) * 0.12;
  col *= 0.8 + 0.2 * sin(fc.y * 3.14159);
  emit(col);
}
`

// Forge heat: a flickering fbm glow along the bottom edge with embers drifting up through it.
const EMBER = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec3 col = vec3(0.0);

  float flicker = 0.6 + 0.5 * fbm(vec2(p.x * 2.5, u_time * 0.35));
  float glow = exp(-uv.y * 4.0) * flicker;
  col += mix(vec3(0.75, 0.12, 0.04), vec3(1.0, 0.5, 0.1), glow) * glow * 0.4;

  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float scale = 7.0 + fl * 6.0;
    vec2 q = p * scale;
    q.y -= u_time * (0.5 + fl * 0.35);
    q.x += sin(q.y * 0.6 + fl * 2.0 + u_time * 0.5) * 0.35;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 13.0);
    if (h > 0.86) {
      vec2 offset = (vec2(hash(id + 3.0), hash(id + 7.0)) - 0.5) * 0.6;
      float d = length(f - offset);
      float flick = 0.55 + 0.45 * sin(u_time * 7.0 + h * 60.0);
      col += vec3(1.0, 0.55, 0.15) * smoothstep(0.11, 0.0, d) * flick
        * smoothstep(1.0, 0.15, uv.y) * (0.75 - fl * 0.15);
    }
  }

  emit(col);
}
`

// Deep ocean: surface caustics (the well-known tileable-caustic iteration) fading with depth,
// swaying god rays from above, and slowly sinking marine snow.
const ABYSS = `
float caustic(vec2 p, float t) {
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec3 col = vec3(0.0);

  float c = caustic(mod(p * 4.0, 6.2832) - 250.0, u_time * 0.35);
  col += vec3(0.3, 0.8, 1.0) * clamp(c, 0.0, 1.0) * 0.22 * smoothstep(0.45, 1.0, uv.y);

  vec2 d = p - vec2(0.5 * aspect, 1.4);
  float a = atan(d.x, -d.y);
  float rays = pow(noise(vec2(a * 9.0 + u_time * 0.06, u_time * 0.1)), 2.5);
  col += vec3(0.35, 0.75, 1.0) * rays * smoothstep(0.0, 1.0, uv.y) * 0.3;

  vec2 q = p * 14.0;
  q.y += u_time * 0.25;
  q.x += sin(q.y * 0.4 + u_time * 0.3) * 0.3;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash(id);
  if (h > 0.9) {
    vec2 offset = (vec2(hash(id + 2.0), hash(id + 5.0)) - 0.5) * 0.6;
    col += vec3(0.6, 0.85, 1.0) * smoothstep(0.08, 0.0, length(f - offset)) * 0.3;
  }

  col += vec3(0.0, 0.12, 0.22) * uv.y * 0.25;
  emit(col);
}
`

// Shared by both Sugar themes - hearts, bubbles, sprinkles, ice cream cones and sparkles, composited
// into one premultiplied layer so Sugar Day can paint it over its sky and Sugar Night can add it
// as dim glowing light.
const SUGAR_LIB = `
float dot2(vec2 v) { return dot(v, v); }

// Inigo Quilez's exact heart SDF - tip at the origin, about one unit tall.
float sdHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

// Four-point anime sparkle.
float sparkle(vec2 d, float size) {
  d = abs(d) / size;
  return max(smoothstep(1.0, 0.0, d.x * 7.0 + d.y), smoothstep(1.0, 0.0, d.y * 7.0 + d.x));
}

vec3 pastel(float h) {
  if (h < 0.2) return vec3(1.0, 0.62, 0.8);
  if (h < 0.4) return vec3(0.62, 0.9, 0.8);
  if (h < 0.6) return vec3(1.0, 0.86, 0.55);
  if (h < 0.8) return vec3(0.78, 0.68, 1.0);
  return vec3(0.6, 0.8, 1.0);
}

// Premultiplied "over" - paints (c, a) on top of the accumulated layer.
vec4 over(vec4 acc, vec3 c, float a) {
  return vec4(c * a + acc.rgb * (1.0 - a), a + acc.a * (1.0 - a));
}

vec4 iceCream(vec2 u, float h) {
  float scoop = smoothstep(0.01, 0.0, length(u - vec2(0.0, 0.12)) - 0.2);
  float cone = step(-0.45, u.y) * step(u.y, 0.05) * step(abs(u.x), (u.y + 0.45) / 0.5 * 0.17);
  float cherry = smoothstep(0.01, 0.0, length(u - vec2(0.0, 0.35)) - 0.05);
  float waffle = step(0.5, fract((u.x + u.y) * 14.0)) * step(0.5, fract((u.x - u.y) * 14.0));
  vec4 acc = vec4(0.0);
  acc = over(acc, mix(vec3(0.95, 0.78, 0.5), vec3(0.86, 0.64, 0.4), waffle), cone);
  acc = over(acc, pastel(h), scoop);
  acc = over(acc, vec3(1.0, 0.4, 0.55), cherry);
  return acc;
}

vec4 sugarLayer(vec2 p, float t) {
  vec4 acc = vec4(0.0);

  // Sprinkles - small rotated capsules tumbling down.
  vec2 q = p * 9.0;
  q.y += t * 0.35;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash(id);
  if (h > 0.72) {
    vec2 d = rot(h * 20.0 + t * (h - 0.85) * 3.0) * (f - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.5);
    float s = length(vec2(max(abs(d.x) - 0.09, 0.0), d.y)) - 0.035;
    acc = over(acc, pastel(fract(h * 7.0)), smoothstep(0.02, 0.0, s) * 0.85);
  }

  // Bubbles - rising rings with a highlight.
  q = p * 4.0;
  q.y -= t * 0.12;
  q.x += sin(q.y * 1.3 + t * 0.4) * 0.15;
  id = floor(q);
  f = fract(q) - 0.5;
  h = hash(id + 11.0);
  if (h > 0.8) {
    vec2 d = f - (vec2(hash(id + 4.0), hash(id + 6.0)) - 0.5) * 0.4;
    float r = 0.1 + h * 0.08;
    float ring = smoothstep(0.025, 0.0, abs(length(d) - r));
    float shine = smoothstep(0.035, 0.0, length(d - vec2(-0.4, 0.4) * r));
    acc = over(acc, mix(vec3(0.75, 0.85, 1.0), vec3(1.0), shine), max(ring * 0.6, shine * 0.8));
  }

  // Hearts - floating up with a gentle wobble.
  q = p * 3.5;
  q.y -= t * 0.08;
  id = floor(q);
  f = fract(q) - 0.5;
  h = hash(id + 23.0);
  if (h > 0.84) {
    vec2 d = f - (vec2(hash(id + 8.0), hash(id + 9.0)) - 0.5) * 0.4;
    d = rot(sin(t * 1.2 + h * 30.0) * 0.3) * d;
    float hd = sdHeart(d / 0.16 + vec2(0.0, 0.5)) * 0.16;
    acc = over(acc, mix(vec3(1.0, 0.55, 0.72), vec3(1.0, 0.75, 0.6), fract(h * 13.0)), smoothstep(0.01, 0.0, hd));
  }

  // Ice cream cones - a few, larger, drifting sideways.
  q = p * 1.6 + vec2(t * 0.03, 0.0);
  id = floor(q);
  f = fract(q) - 0.5;
  h = hash(id + 41.0);
  if (h > 0.7) {
    vec2 d = f - (vec2(hash(id + 3.0), hash(id + 5.0)) - 0.5) * 0.3;
    d = rot(sin(t * 0.7 + h * 10.0) * 0.25) * d;
    vec4 ic = iceCream(d / 0.55, fract(h * 17.0));
    acc = vec4(ic.rgb + acc.rgb * (1.0 - ic.a), ic.a + acc.a * (1.0 - ic.a));
  }

  // Sparkles - twinkling in place.
  q = p * 6.0;
  id = floor(q);
  f = fract(q) - 0.5;
  h = hash(id + 57.0);
  if (h > 0.82) {
    vec2 d = f - (vec2(hash(id + 7.0), hash(id + 2.5)) - 0.5) * 0.5;
    float tw = pow(max(sin(t * (1.0 + h * 2.0) + h * 40.0), 0.0), 3.0);
    acc = over(acc, mix(vec3(1.0, 0.55, 0.85), vec3(1.0, 0.85, 0.45), fract(h * 5.0)), sparkle(d, 0.22 * tw + 0.001));
  }

  return acc;
}
`

// Pastel daydream - the one *light* signature preset. Unlike every other backdrop it lays down an
// opaque sky with paint() rather than adding light with emit(), since additive glow is nearly
// invisible on a light canvas.
const SUGAR_DAY = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;

  vec3 sky = mix(vec3(1.0, 0.86, 0.93), vec3(0.91, 0.87, 1.0), smoothstep(0.0, 0.6, uv.y));
  sky = mix(sky, vec3(0.84, 0.93, 1.0), smoothstep(0.55, 1.0, uv.y));

  vec2 cp = p * vec2(1.1, 2.0) + vec2(t * 0.015, 0.0);
  float cloud = fbm(cp);
  float cloudBelow = fbm(cp + vec2(0.0, -0.06));
  float mask = smoothstep(0.5, 0.62, cloud);
  vec3 cloudColor = mix(vec3(1.0), vec3(0.9, 0.86, 0.98), clamp((cloudBelow - cloud) * 8.0, 0.0, 1.0));
  vec3 col = mix(sky, cloudColor, mask * 0.9);

  // Sweets are muted a little (layer alpha 0.85) so dark UI text stays readable over them.
  vec4 layer = sugarLayer(p, t) * 0.85;
  col = layer.rgb + col * (1.0 - layer.a);
  paint(col, 1.0);
}
`

// The dark-mode take on Sugar Day - dusky violet sky, crescent moon, the same sweets glowing softly.
const SUGAR_NIGHT = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  float t = u_time;
  vec3 col = vec3(0.32, 0.14, 0.38) * uv.y * 0.2 + vec3(0.4, 0.15, 0.3) * (1.0 - uv.y) * 0.1;

  vec2 m = p - vec2(0.32 * aspect, 0.3);
  float moon = smoothstep(0.08, 0.075, length(m)) * smoothstep(0.065, 0.07, length(m - vec2(0.035, 0.025)));
  col += vec3(1.0, 0.92, 0.75) * moon * 0.55 + vec3(0.9, 0.7, 1.0) * exp(-length(m) * 9.0) * 0.12;

  float cloud = smoothstep(0.5, 0.65, fbm(p * vec2(1.1, 2.0) + vec2(t * 0.015, 0.0)));
  col += vec3(0.6, 0.45, 0.8) * cloud * 0.09;

  vec4 layer = sugarLayer(p, t);
  col += layer.rgb * 0.45;
  col += vec3(0.95, 0.9, 1.0) * stars(p, 40.0, 0.06) * 0.4;
  emit(col);
}
`

// Cherry blossom night - soft moon, petals tumbling and spinning down at three depths.
const SAKURA = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  vec3 col = vec3(0.0);

  vec2 m = p - vec2(-0.3 * aspect, 0.28);
  col += vec3(1.0, 0.9, 0.92) * smoothstep(0.1, 0.095, length(m)) * 0.3;
  col += vec3(1.0, 0.6, 0.75) * exp(-length(m) * 5.0) * 0.12;
  col += vec3(0.5, 0.15, 0.3) * (1.0 - uv.y) * 0.08;

  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    vec2 q = p * (4.0 + fl * 3.0);
    q += vec2(u_time * (0.25 + fl * 0.1), u_time * (0.35 + fl * 0.15));
    q.x += sin(q.y * 0.7 + fl) * 0.3;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 17.0);
    if (h > 0.8) {
      vec2 d = f - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.5;
      d = rot(u_time * (h - 0.9) * 8.0 + h * 30.0) * d;
      // Petal - an ellipse with a notch cut into its tip.
      float petal = length(d * vec2(1.0, 1.9)) - 0.13;
      petal = max(petal, -(length(d - vec2(0.13, 0.0)) - 0.035));
      float a = smoothstep(0.015, 0.0, petal);
      vec3 pc = mix(vec3(1.0, 0.55, 0.72), vec3(1.0, 0.85, 0.9), smoothstep(0.1, -0.05, d.x));
      col += pc * a * (0.4 - fl * 0.09);
    }
  }
  emit(col);
}
`

// Rainy window at night - drops sliding down glass over blurred warm city bokeh.
const LOFI_RAIN = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 fc = gl_FragCoord.xy / u_px;
  float screenH = u_res.y / u_px;
  vec3 col = vec3(0.0);

  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    vec2 q = p * (3.0 + fl * 2.0) + vec2(fl * 5.0, 0.0);
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 9.0);
    if (h > 0.5) {
      float d = length(f - (vec2(hash(id + 3.0), hash(id + 4.0)) - 0.5) * 0.5);
      float r = 0.18 + hash(id + 5.0) * 0.15;
      float b = smoothstep(r, r - 0.04, d) * 0.7 + exp(-d * d * 18.0) * 0.3;
      vec3 c = h > 0.85 ? vec3(0.3, 0.8, 0.85) : (h > 0.68 ? vec3(1.0, 0.35, 0.3) : vec3(1.0, 0.65, 0.25));
      col += c * b * (0.13 - fl * 0.04) * (0.75 + 0.25 * sin(u_time * 0.6 + h * 20.0));
    }
  }
  col *= smoothstep(0.95, 0.25, uv.y);

  // Sliding drops, one lane per 28px column, each with a fading trail above it.
  float lane = floor(fc.x / 28.0);
  float hs = hash(vec2(lane, 3.0));
  if (hs > 0.45) {
    float speed = 40.0 + hs * 110.0;
    float y = screenH + 60.0 - mod(u_time * speed + hs * 1000.0, screenH + 260.0);
    float dx = (fract(fc.x / 28.0) - 0.5) * 28.0 - sin(fc.y * 0.04 + hs * 10.0) * 3.0;
    float dy = fc.y - y;
    float drop = smoothstep(4.5, 2.5, length(vec2(dx, dy * 0.8)));
    float trail = (dy > 0.0 && dy < 140.0) ? exp(-abs(dx) * 1.2) * (1.0 - dy / 140.0) : 0.0;
    col += vec3(0.75, 0.85, 0.95) * (drop * 0.35 + trail * 0.1);
  }

  // Beaded droplets resting on the glass.
  vec2 cell = floor(fc / 16.0);
  float hd = hash(cell + 77.0);
  if (hd > 0.82) {
    vec2 d = fract(fc / 16.0) * 16.0 - 8.0 - (vec2(hash(cell + 1.0), hash(cell + 2.0)) - 0.5) * 8.0;
    float r = 1.2 + hd * 2.0;
    col += vec3(0.7, 0.8, 0.9) * (smoothstep(r, r - 1.0, length(d)) * 0.08
      + smoothstep(1.0, 0.0, length(d - vec2(-0.4, 0.4) * r)) * 0.2);
  }
  emit(col);
}
`

// Misty forest at night - low drifting fog and fireflies wandering and blinking.
const FIREFLIES = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec3 col = vec3(0.0);

  float fog = fbm(vec2(p.x * 1.5 + u_time * 0.02, p.y * 3.0));
  col += vec3(0.15, 0.3, 0.2) * fog * smoothstep(0.7, 0.0, uv.y) * 0.3;
  col += vec3(0.25, 0.35, 0.2) * exp(-uv.y * 6.0) * 0.08;

  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    vec2 q = p * (5.0 + fl * 4.0) + vec2(fl * 3.3, 0.0);
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 21.0);
    if (h > 0.65) {
      vec2 wander = vec2(sin(u_time * (0.3 + h * 0.4) + h * 40.0), cos(u_time * (0.25 + h * 0.3) + h * 70.0)) * 0.3;
      float d = length(f - wander);
      float blink = pow(max(sin(u_time * (0.8 + h) + h * 90.0), 0.0), 4.0);
      col += vec3(0.8, 1.0, 0.35) * (smoothstep(0.035, 0.0, d) * 0.8 + exp(-d * d * 90.0) * 0.4) * blink * (1.0 - fl * 0.35);
    }
  }
  emit(col);
}
`

// Holographic trading-card foil - flowing iridescent color with a sheen sweeping across it.
const HOLO = `
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;
  float h = fbm(p * 1.5 + t * 0.03) * 2.0 + dot(p, vec2(0.6, 0.3)) + t * 0.04;
  vec3 iri = 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67)));
  float sweep = exp(-pow((p.x + p.y * 0.6 - (mod(t * 0.12, 4.0) - 2.0)) * 2.5, 2.0));
  float lines = 0.85 + 0.15 * sin((p.x - p.y) * 260.0);
  vec3 col = iri * (0.07 + sweep * 0.22) * lines;
  col += vec3(1.0) * stars(p + vec2(t * 0.01, 0.0), 30.0, 0.05) * (0.25 + sweep * 0.5);
  emit(col);
}
`

// Black hole - a tilted accretion disk lensed over the top of the shadow, slowly churning.
const BLACK_HOLE = `
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  vec2 q = p - vec2(0.28 * aspect, 0.12);
  float r = length(q);
  float hole = 0.09;
  vec3 col = vec3(0.0);

  // Disk in its tilted plane - hidden where it passes behind the shadow.
  vec2 dq = vec2(q.x, q.y / 0.22);
  float dr = length(dq);
  float da = atan(dq.y, dq.x);
  float ring = smoothstep(0.12, 0.17, dr) * smoothstep(0.55, 0.2, dr);
  float swirl = fbm(vec2(da * 2.0 - u_time * 0.25 + dr * 8.0, dr * 10.0));
  float behind = step(r, hole * 1.05) * step(0.0, q.y);
  float doppler = 1.0 + 0.7 * (-dq.x / max(dr, 0.001));
  vec3 hot = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.88, 0.6), smoothstep(0.4, 0.15, dr));
  col += hot * ring * (0.4 + 0.8 * swirl) * doppler * 0.3 * (1.0 - behind);

  // Lensed image of the far side, wrapped over the top, plus the photon ring.
  float halo = smoothstep(0.03, 0.0, abs(r - hole * 1.45)) * smoothstep(-0.02, 0.06, q.y);
  col += hot * halo * (0.5 + 0.6 * fbm(vec2(atan(q.y, q.x) * 3.0 - u_time * 0.3, 1.0))) * 0.3;
  col += vec3(1.0, 0.85, 0.6) * exp(-abs(r - hole * 1.05) * 90.0) * 0.35;
  col *= step(hole, r);
  col += vec3(1.0, 0.6, 0.3) * exp(-r * 6.0) * 0.05 * step(hole, r);
  col += vec3(0.9, 0.9, 1.0) * stars(p, 35.0, 0.05) * smoothstep(0.15, 0.4, r) * 0.4;
  emit(col);
}
`

// Lava lamp - big metaball blobs rising, merging and splitting.
const LAVA_LAMP = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  float field = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float h = hash(vec2(fi, 4.0));
    vec2 c = vec2((h - 0.5) * aspect * 0.9 + sin(u_time * 0.1 + fi * 2.0) * 0.12,
                  sin(u_time * (0.05 + h * 0.06) + fi * 1.7) * 0.55);
    float rad = 0.09 + hash(vec2(fi, 9.0)) * 0.08;
    field += rad * rad / max(dot(p - c, p - c), 0.0001);
  }
  float blob = smoothstep(0.97, 1.03, field);
  float rim = smoothstep(0.75, 0.97, field) * (1.0 - blob);
  vec3 c = mix(vec3(1.0, 0.45, 0.1), vec3(0.95, 0.15, 0.55), uv.y);
  vec3 col = c * blob * (0.2 + 0.15 * smoothstep(1.0, 4.0, field)) + c * rim * 0.05;
  col += mix(vec3(0.5, 0.1, 0.3), vec3(0.5, 0.2, 0.05), uv.y) * 0.05;
  emit(col);
}
`

// Circuit board - dim traces on a grid with pulses of light racing along them, vias at junctions.
const CIRCUIT = `
void main() {
  vec2 fc = gl_FragCoord.xy / u_px;
  float cell = 34.0;
  vec2 id = floor(fc / cell);
  vec2 f = fract(fc / cell) - 0.5;
  vec3 col = vec3(0.0);

  float rowOn = step(0.4, hash(vec2(id.y, 1.0))) * step(0.25, hash(vec2(floor(id.x / 3.0), id.y)));
  float colOn = step(0.45, hash(vec2(id.x, 2.0))) * step(0.3, hash(vec2(id.x, floor(id.y / 3.0) + 50.0)));
  float hLine = rowOn * smoothstep(1.5, 0.5, abs(f.y) * cell);
  float vLine = colOn * smoothstep(1.5, 0.5, abs(f.x) * cell);
  vec3 trace = vec3(0.15, 0.45, 1.0);
  col += trace * max(hLine, vLine) * 0.13;

  float hs = hash(vec2(id.y, 7.0));
  float hPulse = pow(fract(fc.x / (cell * 8.0) - u_time * (0.12 + hs * 0.15) + hs), 16.0);
  float vs = hash(vec2(id.x, 8.0));
  float vPulse = pow(fract(fc.y / (cell * 8.0) - u_time * (0.1 + vs * 0.12) + vs), 16.0);
  col += vec3(0.4, 0.8, 1.0) * (hLine * hPulse + vLine * vPulse) * 0.75;

  float pad = length(f) * cell;
  float via = rowOn * colOn * smoothstep(5.0, 3.5, pad) * (1.0 - smoothstep(2.5, 1.5, pad) * 0.6);
  col += trace * via * 0.4;
  emit(col);
}
`

// Black marble with gold veins, a slow shimmer sweeping across the gold.
const LUXE = `
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float warp = fbm(p * 1.8 + 3.0);
  float v = abs(sin(p.x * 2.5 + p.y * 1.2 + warp * 6.0));
  float vein = pow(1.0 - v, 28.0) + pow(1.0 - abs(sin(p.y * 4.0 - p.x + fbm(p * 3.0) * 5.0)), 60.0) * 0.6;
  float shimmer = pow(0.5 + 0.5 * sin(p.x * 2.0 + p.y - u_time * 0.5), 6.0);
  vec3 col = vec3(1.0, 0.78, 0.38) * vein * (0.12 + 0.4 * shimmer);
  col += vec3(0.7, 0.7, 0.75) * smoothstep(0.45, 0.8, fbm(p * 2.5 - 1.0)) * 0.025;
  emit(col);
}
`

// 8-bit arcade - a chunky pixel starfield with little pixel invaders drifting past. Sprite rows are
// stored as floats and unpacked with mod/pow because GLSL ES 1.0 has no integer bitwise ops or
// array literals.
const ARCADE = `
float invaderRow(float y, float frame) {
  if (y < 0.5) return frame < 0.5 ? 165.0 : 66.0;
  if (y < 1.5) return frame < 0.5 ? 90.0 : 129.0;
  if (y < 2.5) return frame < 0.5 ? 36.0 : 90.0;
  if (y < 3.5) return 255.0;
  if (y < 4.5) return 219.0;
  if (y < 5.5) return 126.0;
  if (y < 6.5) return 60.0;
  return 24.0;
}

vec3 neon(float h) {
  if (h < 0.25) return vec3(1.0, 0.3, 0.8);
  if (h < 0.5) return vec3(0.3, 0.9, 1.0);
  if (h < 0.75) return vec3(0.4, 1.0, 0.4);
  return vec3(1.0, 0.9, 0.3);
}

void main() {
  vec2 px = floor(gl_FragCoord.xy / u_px / 4.0);
  vec3 col = vec3(0.0);

  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    vec2 sp = px + vec2(0.0, floor(u_time * (6.0 + fl * 8.0)));
    float s = step(0.996 - fl * 0.002, hash(sp + fl * 40.0));
    col += vec3(0.8, 0.85, 1.0) * s * (0.25 + fl * 0.15);
  }

  vec2 g = px + vec2(floor(u_time * 3.0), 0.0);
  vec2 cell = floor(g / vec2(26.0, 20.0));
  vec2 local = mod(g, vec2(26.0, 20.0)) - vec2(9.0, 6.0);
  float h = hash(cell + 3.0);
  if (h > 0.78 && local.x >= 0.0 && local.x < 8.0 && local.y >= 0.0 && local.y < 8.0) {
    float frame = mod(floor(u_time * 2.0 + h * 10.0), 2.0);
    float row = invaderRow(local.y, frame);
    float bit = mod(floor(row / pow(2.0, local.x)), 2.0);
    col += neon(fract(h * 9.0)) * bit * 0.32;
  }

  col *= 0.85 + 0.15 * sin(gl_FragCoord.y / u_px * 3.14159);
  emit(col);
}
`

// --- Holiday backdrops (see `holidays.ts`). Foreground props (bats, snowman, lanterns...) are DOM
// decorations in `HolidayDecorations.tsx`, not part of these shaders. ---

// Christmas - snow at three depths, a soft snowbank glow along the bottom, faint stars.
const CHRISTMAS = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec3 col = vec3(0.05, 0.15, 0.12) * uv.y * 0.18;
  col += vec3(0.9, 0.95, 1.0) * stars(p, 40.0, 0.05) * smoothstep(0.4, 0.9, uv.y) * 0.35;

  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    vec2 q = p * (4.0 + fl * 4.0);
    q.y += u_time * (0.12 + fl * 0.08);
    q.x += sin(q.y * 0.8 + u_time * 0.5 + fl) * 0.2;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 31.0);
    if (h > 0.55) {
      float d = length(f - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.6);
      float size = 0.07 - fl * 0.015;
      col += vec3(0.9, 0.95, 1.0) * smoothstep(size, size * 0.3, d) * (0.35 - fl * 0.08);
    }
  }

  float bank = smoothstep(0.12, 0.0, uv.y + (fbm(vec2(p.x * 3.0, 1.0)) - 0.5) * 0.06);
  col += vec3(0.85, 0.92, 1.0) * bank * 0.16;
  emit(col);
}
`

// Halloween - a big harvest moon with clouds drifting across it, purple sky, green ground fog.
const HALLOWEEN = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  vec3 col = vec3(0.25, 0.08, 0.35) * uv.y * 0.18;

  vec2 m = p - vec2(0.3 * aspect, 0.26);
  float clouds = smoothstep(0.45, 0.7, fbm(p * vec2(2.0, 4.0) + vec2(u_time * 0.03, 0.0)));
  float moon = smoothstep(0.13, 0.125, length(m));
  float craters = fbm(m * 18.0) * 0.25;
  col += vec3(1.0, 0.75, 0.35) * moon * (0.42 - craters * 0.4) * (1.0 - clouds * 0.75);
  col += vec3(1.0, 0.55, 0.2) * exp(-length(m) * 6.0) * 0.12 * (1.0 - clouds * 0.5);
  col += vec3(0.35, 0.25, 0.45) * clouds * 0.05;

  float fog = fbm(vec2(p.x * 1.5 - u_time * 0.04, p.y * 3.0));
  col += vec3(0.3, 0.75, 0.3) * fog * smoothstep(0.45, 0.0, uv.y) * 0.16;
  emit(col);
}
`

// Valentine's - soft glowing hearts drifting upward through a rose haze.
const VALENTINES = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec3 col = vec3(0.45, 0.08, 0.2) * (1.0 - uv.y) * 0.12;

  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    vec2 q = p * (2.5 + fl * 2.0) + vec2(fl * 7.0, 0.0);
    q.y -= u_time * (0.06 + fl * 0.04);
    q.x += sin(q.y * 1.1 + fl * 2.0 + u_time * 0.3) * 0.15;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 11.0);
    if (h > 0.8) {
      vec2 d = f - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.4;
      d = rot(sin(u_time + h * 20.0) * 0.25) * d;
      float hd = sdHeart(d / 0.2 + vec2(0.0, 0.5)) * 0.2;
      vec3 c = mix(vec3(1.0, 0.3, 0.45), vec3(1.0, 0.6, 0.75), fract(h * 9.0));
      col += c * (smoothstep(0.012, 0.0, hd) * 0.3 + exp(-max(hd, 0.0) * 40.0) * 0.08) * (1.0 - fl * 0.25);
    }
  }
  emit(col);
}
`

// Lunar New Year - glowing sky lanterns rising at three depths, gold sparkles, a warm red glow.
const LUNAR_NEW_YEAR = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec3 col = vec3(0.5, 0.06, 0.04) * (1.0 - uv.y) * 0.16;

  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    vec2 q = p * (4.5 + fl * 3.0) + vec2(fl * 4.0, 0.0);
    q.y -= u_time * (0.05 + fl * 0.03);
    q.x += sin(q.y * 0.9 + fl + u_time * 0.2) * 0.12;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 19.0);
    if (h > 0.8) {
      vec2 d = f - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.4;
      // Lantern body - a rounded box slightly wider at the top.
      vec2 b = abs(d) - vec2(0.09 - d.y * 0.15, 0.12);
      float box = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.03;
      float flicker = 0.8 + 0.2 * sin(u_time * 5.0 + h * 40.0);
      vec3 c = mix(vec3(1.0, 0.35, 0.1), vec3(1.0, 0.75, 0.3), smoothstep(0.12, -0.12, d.y));
      col += c * (smoothstep(0.01, 0.0, box) * 0.24 + exp(-max(box, 0.0) * 25.0) * 0.08) * flicker * (1.0 - fl * 0.25);
    }
  }
  col += vec3(1.0, 0.82, 0.4) * stars(p, 36.0, 0.05) * 0.45;
  emit(col);
}
`

// New Year's Eve - fireworks: bursts of falling sparks in staggered slots over a starry sky.
const NEW_YEARS_EVE = `
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  vec3 col = vec3(0.85, 0.9, 1.0) * stars(p, 40.0, 0.05) * 0.35;

  for (int b = 0; b < 4; b++) {
    float fb = float(b);
    float period = 4.0;
    float tt = u_time + fb * period * 0.27;
    float slot = floor(tt / period);
    float age = fract(tt / period);
    vec2 origin = vec2((hash(vec2(slot, fb)) - 0.5) * aspect * 0.85, hash(vec2(fb, slot + 3.0)) * 0.35 + 0.05);
    float hue = hash(vec2(slot * 1.7, fb));
    vec3 c = 0.55 + 0.45 * cos(6.2832 * (hue + vec3(0.0, 0.33, 0.67)));
    if (age < 0.75) {
      float a = age / 0.75;
      float spread = 1.0 - pow(1.0 - a, 3.0);
      for (int i = 0; i < 28; i++) {
        float fi = float(i);
        float ang = fi / 28.0 * 6.2832 + hash(vec2(slot, fi)) * 0.3;
        float speed = 0.2 + hash(vec2(fi, slot)) * 0.08;
        vec2 pos = origin + vec2(cos(ang), sin(ang)) * speed * spread - vec2(0.0, a * a * 0.1);
        float d = length(p - pos);
        col += c * exp(-d * d * 6000.0) * (1.0 - a) * 0.9;
      }
      col += c * exp(-length(p - origin) * 9.0) * max(0.0, 0.25 - a) * 0.8;
    }
  }
  emit(col);
}
`

// Easter - the one light holiday: a sunny spring sky, rolling pastel hills dotted with flowers,
// petals drifting down. Painted opaque with paint(), like Sugar Day.
const EASTER = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;

  vec3 col = mix(vec3(1.0, 0.97, 0.88), vec3(0.82, 0.92, 1.0), smoothstep(0.1, 0.9, uv.y));
  col += vec3(1.0, 0.95, 0.7) * exp(-length(p - vec2(-0.38 * aspect, 0.42)) * 4.0) * 0.25;
  float cloud = smoothstep(0.52, 0.66, fbm(p * vec2(1.2, 2.4) + vec2(u_time * 0.012, 3.0)));
  col = mix(col, vec3(1.0), cloud * 0.8 * smoothstep(0.35, 0.7, uv.y));

  float far = 0.2 + 0.035 * sin(p.x * 2.2 + 1.0) + 0.02 * sin(p.x * 5.0);
  float near = 0.11 + 0.04 * sin(p.x * 1.6 + 2.5) + 0.015 * sin(p.x * 6.0 + 1.0);
  col = mix(col, vec3(0.8, 0.93, 0.74), smoothstep(far + 0.003, far - 0.003, uv.y));
  col = mix(col, vec3(0.72, 0.89, 0.66), smoothstep(near + 0.003, near - 0.003, uv.y));

  // Flowers on the near hill.
  vec2 fq = p * 22.0;
  vec2 fid = floor(fq);
  float fh = hash(fid + 5.0);
  if (fh > 0.8 && uv.y < near - 0.01) {
    float d = length(fract(fq) - 0.5 - (vec2(hash(fid + 1.0), hash(fid + 2.0)) - 0.5) * 0.5);
    col = mix(col, pastel(fract(fh * 11.0)), smoothstep(0.14, 0.1, d));
  }

  // Petals drifting down.
  vec2 q = p * 5.0;
  q += vec2(u_time * 0.15, u_time * 0.22);
  q.x += sin(q.y * 0.8) * 0.3;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash(id + 13.0);
  if (h > 0.82) {
    vec2 d = rot(u_time * (h - 0.9) * 6.0 + h * 30.0) * (f - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.5);
    float petal = length(d * vec2(1.0, 1.9)) - 0.09;
    col = mix(col, pastel(fract(h * 7.0)), smoothstep(0.012, 0.0, petal) * 0.85);
  }
  paint(col, 1.0);
}
`

export interface AmbientShader {
  source: string
  // Canvas resolution relative to CSS pixels. Soft, noise-heavy backdrops render at half
  // resolution (4x fewer fragments - the dominant cost) and upscale invisibly; hard-edged ones
  // (grid lines, glyphs) need more to stay crisp.
  resolutionScale: number
}

export const AMBIENT_SHADERS: Partial<Record<ThemePreset | HolidayKey, AmbientShader>> = {
  synthwave: { source: PRELUDE + SYNTHWAVE, resolutionScale: 0.75 },
  aurora: { source: PRELUDE + AURORA, resolutionScale: 0.5 },
  nebula: { source: PRELUDE + NEBULA, resolutionScale: 0.5 },
  terminal: { source: PRELUDE + TERMINAL, resolutionScale: 1 },
  ember: { source: PRELUDE + EMBER, resolutionScale: 0.5 },
  abyss: { source: PRELUDE + ABYSS, resolutionScale: 0.5 },
  sugarDay: { source: PRELUDE + SUGAR_LIB + SUGAR_DAY, resolutionScale: 0.75 },
  sugarNight: { source: PRELUDE + SUGAR_LIB + SUGAR_NIGHT, resolutionScale: 0.75 },
  sakura: { source: PRELUDE + SAKURA, resolutionScale: 0.75 },
  lofiRain: { source: PRELUDE + LOFI_RAIN, resolutionScale: 0.75 },
  fireflies: { source: PRELUDE + FIREFLIES, resolutionScale: 0.5 },
  holo: { source: PRELUDE + HOLO, resolutionScale: 0.5 },
  blackHole: { source: PRELUDE + BLACK_HOLE, resolutionScale: 0.75 },
  lavaLamp: { source: PRELUDE + LAVA_LAMP, resolutionScale: 0.5 },
  circuit: { source: PRELUDE + CIRCUIT, resolutionScale: 1 },
  luxe: { source: PRELUDE + LUXE, resolutionScale: 0.5 },
  arcade: { source: PRELUDE + ARCADE, resolutionScale: 0.5 },
  christmas: { source: PRELUDE + CHRISTMAS, resolutionScale: 0.5 },
  halloween: { source: PRELUDE + HALLOWEEN, resolutionScale: 0.5 },
  // Valentine's/Easter borrow SUGAR_LIB for its heart SDF/rot()/pastel() helpers.
  valentines: { source: PRELUDE + SUGAR_LIB + VALENTINES, resolutionScale: 0.5 },
  lunarNewYear: { source: PRELUDE + LUNAR_NEW_YEAR, resolutionScale: 0.5 },
  newYearsEve: { source: PRELUDE + NEW_YEARS_EVE, resolutionScale: 0.5 },
  easter: { source: PRELUDE + SUGAR_LIB + EASTER, resolutionScale: 0.75 },
}
