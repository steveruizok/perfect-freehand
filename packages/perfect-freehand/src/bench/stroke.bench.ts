import { bench, describe } from 'vitest'
import { getStroke } from '../getStroke'
import { getStrokePoints } from '../getStrokePoints'
import { getStrokeOutlinePoints } from '../getStrokeOutlinePoints'
import type { StrokeOptions } from '../types'
import inputs from '../test/inputs.json'

const { onePoint, twoPoints, manyPoints, hey, withDuplicates, objectPairs } =
  inputs

// Generate synthetic large datasets for stress testing
function generateSyntheticPoints(count: number): number[][] {
  const points: number[][] = []
  for (let i = 0; i < count; i++) {
    const t = i / count
    // Create a spiral pattern for realistic stroke simulation
    const angle = t * Math.PI * 4
    const radius = 50 + t * 200
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    const pressure = 0.3 + Math.sin(t * Math.PI) * 0.4
    points.push([x, y, pressure])
  }
  return points
}

const largePoints = generateSyntheticPoints(500)
const veryLargePoints = generateSyntheticPoints(1000)

// Pre-compute StrokePoints for isolated outline benchmarks
const precomputedStrokePoints = {
  manyPoints: getStrokePoints(manyPoints),
  hey: getStrokePoints(hey),
  large: getStrokePoints(largePoints),
  veryLarge: getStrokePoints(veryLargePoints),
}

// Option variations for testing different code paths
const defaultOptions: StrokeOptions = {}
const noSimulatePressure: StrokeOptions = { simulatePressure: false }
const withTaper: StrokeOptions = {
  start: { taper: 50 },
  end: { taper: 50 },
}
const noThinning: StrokeOptions = { thinning: 0 }
const typicalDrawing: StrokeOptions = {
  size: 16,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
}
const completedStroke: StrokeOptions = { last: true }

describe('getStrokePoints', () => {
  bench('manyPoints (97 pts)', () => {
    getStrokePoints(manyPoints)
  })

  bench('hey (302 pts)', () => {
    getStrokePoints(hey)
  })

  bench('large (500 pts)', () => {
    getStrokePoints(largePoints)
  })

  bench('veryLarge (1000 pts)', () => {
    getStrokePoints(veryLargePoints)
  })
})

describe('getStrokeOutlinePoints', () => {
  bench('default options', () => {
    getStrokeOutlinePoints(precomputedStrokePoints.manyPoints, defaultOptions)
  })

  bench('simulatePressure: false', () => {
    getStrokeOutlinePoints(
      precomputedStrokePoints.manyPoints,
      noSimulatePressure
    )
  })

  bench('with taper', () => {
    getStrokeOutlinePoints(precomputedStrokePoints.manyPoints, withTaper)
  })

  bench('thinning: 0', () => {
    getStrokeOutlinePoints(precomputedStrokePoints.manyPoints, noThinning)
  })

  bench('large dataset (500 pts)', () => {
    getStrokeOutlinePoints(precomputedStrokePoints.large, defaultOptions)
  })

  bench('veryLarge dataset (1000 pts)', () => {
    getStrokeOutlinePoints(precomputedStrokePoints.veryLarge, defaultOptions)
  })
})

describe('getStroke (end-to-end)', () => {
  bench('manyPoints - default', () => {
    getStroke(manyPoints)
  })

  bench('hey - default', () => {
    getStroke(hey)
  })

  bench('large (500 pts) - default', () => {
    getStroke(largePoints)
  })

  bench('veryLarge (1000 pts) - default', () => {
    getStroke(veryLargePoints)
  })

  bench('typical drawing config', () => {
    getStroke(manyPoints, typicalDrawing)
  })

  bench('last: true (completed stroke)', () => {
    getStroke(manyPoints, completedStroke)
  })
})

describe('Edge cases', () => {
  bench('onePoint', () => {
    getStroke(onePoint)
  })

  bench('twoPoints', () => {
    getStroke(twoPoints)
  })

  bench('withDuplicates (18 pts)', () => {
    getStroke(withDuplicates)
  })

  bench('objectPairs format', () => {
    getStroke(objectPairs)
  })
})
