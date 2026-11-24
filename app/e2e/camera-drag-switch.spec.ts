import { test, expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __hew_test?: import('../src/test/harness').HewTestHarness
  }
}

/**
 * orbitDragSwitch (viewport/orbitDragSwitch.ts) — driven end to end with
 * REAL pointer/keyboard input:
 *
 *  1. Shift pressed MID-DRAG inverts orbit <-> pan (and back on release),
 *     for both a left-drag under the Orbit tool and a middle-drag under the
 *     Select tool.
 *  2. Middle- and right-button orbit and pan stop immediately after a drag.
 */

const CAMERA = {
  position: [8, 6, 8] as [number, number, number],
  target: [1, 1, 0.5] as [number, number, number],
  up: [0, 0, 1] as [number, number, number],
  fovDeg: 45,
}

async function setup(page: Page): Promise<{ cx: number; cy: number }> {
  await page.goto('/')
  await page.waitForFunction(() => window.__hew_test?.isReady() === true, null, {
    timeout: 15_000,
  })
  await page.evaluate((cam) => window.__hew_test!.setCamera(cam), CAMERA)
  await page.waitForTimeout(100)
  const canvas = await page.locator('canvas').first().boundingBox()
  if (canvas === null) throw new Error('no canvas')
  // Click the canvas so it has focus for the bare-letter tool shortcut.
  await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2)
  await page.waitForTimeout(50)
  return { cx: canvas.x + canvas.width / 2, cy: canvas.y + canvas.height / 2 }
}

async function getCam(page: Page): Promise<{ position: [number, number, number]; target: [number, number, number] }> {
  return page.evaluate(() => {
    const c = window.__hew_test!.getCamera()
    return { position: c.position, target: c.target }
  })
}

function dist(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** Normalized eye->target-independent viewing direction (target -> position). */
function eyeDir(cam: { position: [number, number, number]; target: [number, number, number] }): [number, number, number] {
  const d: [number, number, number] = [
    cam.position[0] - cam.target[0],
    cam.position[1] - cam.target[1],
    cam.position[2] - cam.target[2],
  ]
  const len = Math.hypot(d[0], d[1], d[2]) || 1
  return [d[0] / len, d[1] / len, d[2] / len]
}

test('Orbit tool (left-drag): Shift mid-drag switches orbit to pan, and back on release', async ({ page }) => {
  const { cx, cy } = await setup(page)
  await page.keyboard.press('o')
  await page.waitForTimeout(100)

  await page.mouse.move(cx, cy)
  await page.mouse.down()

  // Orbit segment: target unchanged, position (the eye) moves.
  const camBefore = await getCam(page)
  await page.mouse.move(cx + 120, cy, { steps: 10 })
  await page.waitForTimeout(50)
  const camAfterOrbit = await getCam(page)
  expect(dist(camAfterOrbit.target, camBefore.target)).toBeLessThan(1e-6)
  expect(dist(camAfterOrbit.position, camBefore.position)).toBeGreaterThan(0.01)

  // Shift down mid-drag -> switches to pan. Sample the direction shortly
  // after Shift lands (before any further pointer motion).
  await page.keyboard.down('Shift')
  await page.waitForTimeout(100)
  const camAtShiftDown = await getCam(page)
  const dirAtShiftDown = eyeDir(camAtShiftDown)

  await page.mouse.move(cx + 240, cy, { steps: 10 })
  await page.waitForTimeout(50)
  const camAfterPan = await getCam(page)
  const dirAfterPan = eyeDir(camAfterPan)

  // A pan moves the TARGET; the eye-to-target direction stays fixed (the
  // orbit stopped turning the instant Shift landed, not merely inverted).
  expect(dist(camAfterPan.target, camAtShiftDown.target)).toBeGreaterThan(0.01)
  expect(dist(dirAfterPan, dirAtShiftDown)).toBeLessThan(0.02)

  // Shift up -> back to orbit: target stops moving, direction changes again.
  await page.keyboard.up('Shift')
  await page.waitForTimeout(50)
  const camAtShiftUp = await getCam(page)
  await page.mouse.move(cx + 360, cy, { steps: 10 })
  await page.waitForTimeout(50)
  const camAfterOrbit2 = await getCam(page)
  expect(dist(camAfterOrbit2.target, camAtShiftUp.target)).toBeLessThan(1e-6)
  expect(dist(eyeDir(camAfterOrbit2), eyeDir(camAtShiftUp))).toBeGreaterThan(0.01)

  await page.mouse.up()
})

test('Select tool (middle-drag): Shift mid-drag switches orbit to pan, and back on release', async ({ page }) => {
  const { cx, cy } = await setup(page)
  // Select is the default tool; make it explicit.
  await page.keyboard.press(' ')
  await page.waitForTimeout(100)

  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'middle' })

  const camBefore = await getCam(page)
  await page.mouse.move(cx + 120, cy, { steps: 10 })
  await page.waitForTimeout(50)
  const camAfterOrbit = await getCam(page)
  expect(dist(camAfterOrbit.target, camBefore.target)).toBeLessThan(1e-6)
  expect(dist(camAfterOrbit.position, camBefore.position)).toBeGreaterThan(0.01)

  await page.keyboard.down('Shift')
  await page.waitForTimeout(100)
  const camAtShiftDown = await getCam(page)
  const dirAtShiftDown = eyeDir(camAtShiftDown)

  await page.mouse.move(cx + 240, cy, { steps: 10 })
  await page.waitForTimeout(50)
  const camAfterPan = await getCam(page)
  expect(dist(camAfterPan.target, camAtShiftDown.target)).toBeGreaterThan(0.01)
  expect(dist(eyeDir(camAfterPan), dirAtShiftDown)).toBeLessThan(0.02)

  await page.keyboard.up('Shift')
  await page.waitForTimeout(50)
  const camAtShiftUp = await getCam(page)
  await page.mouse.move(cx + 360, cy, { steps: 10 })
  await page.waitForTimeout(50)
  const camAfterOrbit2 = await getCam(page)
  expect(dist(camAfterOrbit2.target, camAtShiftUp.target)).toBeLessThan(1e-6)
  expect(dist(eyeDir(camAfterOrbit2), eyeDir(camAtShiftUp))).toBeGreaterThan(0.01)

  await page.mouse.up({ button: 'middle' })
})

test('Select tool (right-drag): pan switches to orbit and back without starting Fly', async ({ page }) => {
  const { cx, cy } = await setup(page)
  await page.keyboard.press(' ')
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  const start = await getCam(page)
  await page.mouse.move(cx + 100, cy, { steps: 10 })
  const panned = await getCam(page)
  expect(dist(panned.target, start.target)).toBeGreaterThan(0.01)
  expect(dist(eyeDir(panned), eyeDir(start))).toBeLessThan(0.02)

  await page.keyboard.down('Shift')
  const beforeOrbit = await getCam(page)
  await page.mouse.move(cx + 200, cy, { steps: 10 })
  const orbited = await getCam(page)
  expect(dist(orbited.target, beforeOrbit.target)).toBeLessThan(1e-6)
  expect(dist(eyeDir(orbited), eyeDir(beforeOrbit))).toBeGreaterThan(0.01)

  await page.keyboard.up('Shift')
  const beforePan = await getCam(page)
  await page.mouse.move(cx + 300, cy, { steps: 10 })
  const pannedAgain = await getCam(page)
  expect(dist(pannedAgain.target, beforePan.target)).toBeGreaterThan(0.01)
  expect(dist(eyeDir(pannedAgain), eyeDir(beforePan))).toBeLessThan(0.02)
  await page.mouse.up({ button: 'right' })
})

for (const button of ['middle', 'right'] as const) {
  for (const pan of [false, true]) {
    test(`${button} ${pan ? 'pan' : 'orbit'} stops immediately after release`, async ({ page }) => {
      const { cx, cy } = await setup(page)
      await page.mouse.move(cx, cy)
      const shift = button === 'middle' ? pan : !pan
      if (shift) await page.keyboard.down('Shift')
      await page.mouse.down({ button })
      const before = await getCam(page)
      await page.mouse.move(cx + 150, cy + 30, { steps: 4 })
      await page.mouse.up({ button })
      const immediate = await getCam(page)
      await page.waitForTimeout(300)
      const later = await getCam(page)
      if (shift) await page.keyboard.up('Shift')
      expect(dist(immediate.position, before.position)).toBeGreaterThan(0.01)
      expect(dist(later.position, immediate.position)).toBeLessThan(1e-6)
      expect(dist(later.target, immediate.target)).toBeLessThan(1e-6)
    })
  }
}
