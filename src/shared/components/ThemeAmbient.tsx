import type { HolidayKey } from '@/shared/theme/holidays'
import type { ThemePreset } from '@/shared/theme/presets'
import { useEffect, useRef, useState } from 'react'
import { useActiveThemeStore } from '@/shared/stores/activeThemeStore'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { AMBIENT_SHADERS } from '@/shared/theme/ambientShaders'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'

// 30fps is plenty for slow ambient motion and halves GPU time vs. a 60Hz rAF - this runs for
// hours behind an idling app, so steady-state cost matters more than smoothness.
const FRAME_INTERVAL_MS = 1000 / 30
// Wrap the time uniform so a multi-day session never loses float precision inside the shaders
// (visible as stuttering/banding once seconds get large). One hour keeps the wrap seam rare.
const TIME_WRAP_SECONDS = 3600
// Slow-device watchdog: after a warm-up, if the average gap between *drawn* frames over a sample
// window exceeds this, the device can't hold even ~20fps of a 30fps target - the backdrop is then
// costing more than it's worth, so it freezes to a static frame for the rest of the session.
// Catches low-end Windows hardware, which `forceReducedMotion` (WebKitGTK-version based, always
// `false` on Windows) can't see.
const SLOW_FRAME_AVERAGE_MS = 50
const WATCHDOG_WARMUP_FRAMES = 30
const WATCHDOG_SAMPLE_FRAMES = 60

// Module-level, not component state - survives preset switches and remounts, so once a device is
// measured too slow no other signature preset re-tries animating until the app restarts.
let isTooSlowThisSession = false

const VERTEX_SOURCE = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    logFrontendWarn('ThemeAmbient', 'Ambient shader failed to compile', {
      log: gl.getShaderInfoLog(shader),
    })
    gl.deleteShader(shader)
    return null
  }
  return shader
}

// The animated backdrop for a signature theme preset (see `ambientShaders.ts`), mounted inside
// `CustomBackground` between its solid canvas layer and the content. Renders nothing for a plain
// color preset. Any failure (no WebGL, shader compile error, context loss) degrades to that preset's
// plain recolor - a backdrop is decoration, never worth an error surface.
//
// Performance guards, in order of when they apply:
// - Software rendering (no usable GPU) never gets a context at all - see `getContext` below.
// - Motion is frozen to one static frame (not hidden) under the OS reduced-motion preference or
//   `forceReducedMotion` (old WebKitGTK, see `platformStore`), matching how the app's other
//   ambient animations are gated.
// - The slow-device watchdog (`SLOW_FRAME_AVERAGE_MS`) freezes it on hardware too weak to keep up.
// - Animation pauses (keeping its last frame) whenever the window isn't focused - this app spends
//   hours unattended while idling, and nobody is watching the backdrop then. rAF itself already
//   stops entirely while the window is minimized/hidden to tray.
export const ThemeAmbient = () => {
  const preset = useActiveThemeStore(state => state.preset)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  // Bumped on `webglcontextrestored` to rebuild the GL program from scratch.
  const [contextGeneration, setContextGeneration] = useState(0)

  const shader = AMBIENT_SHADERS[preset as ThemePreset | HolidayKey]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !shader) return

    // `failIfMajorPerformanceCaveat` makes the browser refuse a context backed by a software
    // rasterizer (SwiftShader/WARP on Windows, llvmpipe on Linux) - a full-screen shader on the CPU
    // would peg it, so those devices get the plain recolor instead.
    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: true,
      antialias: false,
      failIfMajorPerformanceCaveat: true,
    })
    if (!gl) {
      logFrontendWarn('ThemeAmbient', 'Hardware WebGL unavailable, signature theme backdrop off', {
        preset,
      })
      return
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, shader.source)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      logFrontendWarn('ThemeAmbient', 'Ambient shader failed to link', {
        preset,
        log: gl.getProgramInfoLog(program),
      })
      return
    }
    gl.useProgram(program)

    // One oversized triangle covering the viewport - cheaper than a two-triangle quad (no
    // diagonal seam where fragments get shaded twice).
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const posLocation = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(posLocation)
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0)

    const resLocation = gl.getUniformLocation(program, 'u_res')
    const pxLocation = gl.getUniformLocation(program, 'u_px')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    gl.uniform1f(pxLocation, shader.resolutionScale)

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isStatic = () => forceReducedMotion || reducedMotionQuery.matches || isTooSlowThisSession
    const startTime = performance.now()
    let frameId = 0
    let lastFrame = 0
    let watchdogFrames = 0
    let watchdogTotalMs = 0

    // Deliberately ignores devicePixelRatio - `resolutionScale` is relative to CSS pixels, and a
    // HiDPI backdrop would multiply fragment cost for detail nobody can see behind the UI.
    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth * shader.resolutionScale))
      const height = Math.max(1, Math.round(canvas.clientHeight * shader.resolutionScale))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
      gl.uniform2f(resLocation, width, height)
    }

    const draw = (seconds: number) => {
      gl.uniform1f(timeLocation, seconds % TIME_WRAP_SECONDS)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = (now: number) => {
      frameId = requestAnimationFrame(loop)
      const elapsed = now - lastFrame
      if (elapsed < FRAME_INTERVAL_MS) return
      // Skip the first drawn frame after (re)starting - its gap includes however long the loop
      // was paused, not render cost.
      if (lastFrame !== 0) {
        watchdogFrames += 1
        if (watchdogFrames > WATCHDOG_WARMUP_FRAMES) watchdogTotalMs += elapsed
        if (watchdogFrames === WATCHDOG_WARMUP_FRAMES + WATCHDOG_SAMPLE_FRAMES) {
          const averageMs = watchdogTotalMs / WATCHDOG_SAMPLE_FRAMES
          if (averageMs > SLOW_FRAME_AVERAGE_MS) {
            isTooSlowThisSession = true
            cancelAnimationFrame(frameId)
            logFrontendWarn('ThemeAmbient', 'Device too slow, signature backdrop frozen', {
              preset,
              averageFrameMs: Math.round(averageMs),
            })
            return
          }
        }
      }
      lastFrame = now
      draw((now - startTime) / 1000 + 20)
    }

    // The static (reduced-motion) frame uses a fixed, non-zero time so each backdrop shows a
    // representative pose rather than t=0, where some patterns start out empty. The animated loop
    // adds the same offset so motion starts from that pose.
    const start = () => {
      cancelAnimationFrame(frameId)
      resize()
      if (isStatic()) {
        draw(20)
      } else if (document.hasFocus()) {
        lastFrame = 0
        frameId = requestAnimationFrame(loop)
      } else {
        // Unfocused at mount - draw one frame so the backdrop isn't blank until first focus.
        draw((performance.now() - startTime) / 1000 + 20)
      }
    }
    // The canvas keeps the last drawn frame (no clear between frames is ever issued), so pausing
    // is just stopping the loop.
    const pause = () => cancelAnimationFrame(frameId)

    // Resizing a canvas clears it, so a paused/static backdrop must redraw here - the animated
    // loop would repaint on its own next tick anyway.
    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (isStatic()) {
        draw(20)
      } else if (!document.hasFocus()) {
        draw((performance.now() - startTime) / 1000 + 20)
      }
    })
    resizeObserver.observe(canvas)

    const handleContextLost = (event: Event) => {
      // Required for the browser to ever fire `webglcontextrestored`.
      event.preventDefault()
      cancelAnimationFrame(frameId)
      logFrontendWarn('ThemeAmbient', 'WebGL context lost, waiting for restore', { preset })
    }
    const handleContextRestored = () => setContextGeneration(generation => generation + 1)
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    reducedMotionQuery.addEventListener('change', start)
    window.addEventListener('focus', start)
    window.addEventListener('blur', pause)

    start()
    setIsVisible(true)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      reducedMotionQuery.removeEventListener('change', start)
      window.removeEventListener('focus', start)
      window.removeEventListener('blur', pause)
      setIsVisible(false)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [preset, shader, forceReducedMotion, contextGeneration])

  if (!shader) return null

  // `key={preset}` gives every preset a fresh canvas - a WebGL context is bound to its canvas, and
  // reusing one across presets would leave the previous program's last frame visible until the
  // new one draws. Fades in on first appearance (e.g. once `useTheme` resolves after launch).
  return (
    <canvas
      key={preset}
      ref={canvasRef}
      aria-hidden='true'
      className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}
