import type { StrokeOptions } from '../types'
import { getStroke } from '../getStroke'
import inputs from './inputs.json'
import { med } from '../vec'

const { onePoint, twoPoints, twoEqualPoints, manyPoints, withDuplicates } =
  inputs

function getRng(seed = ''): () => number {
  let x = 0
  let y = 0
  let z = 0
  let w = 0

  function next() {
    const t = x ^ (x << 11)
    ;(x = y), (y = z), (z = w)
    w ^= ((w >>> 19) ^ t ^ (t >>> 8)) >>> 0
    return w / 0x100000000
  }

  for (let k = 0; k < seed.length + 64; k++) {
    x ^= seed.charCodeAt(k) | 0
    next()
  }

  return next
}

const average = (a: number, b: number) => (a + b) / 2

function getSvgPathFromStroke(points: number[][]): string {
  const len = points.length

  if (!len) {
    return ''
  }

  const first = points[0]
  let result = `M${first[0].toFixed(3)},${first[1].toFixed(3)}Q`

  for (let i = 0, max = len - 1; i < max; i++) {
    const a = points[i]
    const b = points[i + 1]
    result += `${a[0].toFixed(3)},${a[1].toFixed(3)} ${average(
      a[0],
      b[0]
    ).toFixed(3)},${average(a[1], b[1]).toFixed(3)} `
  }

  result += 'Z'

  return result
}

describe('getStroke', () => {
  const rng = getRng('perfect')

  for (const [key, value] of Object.entries(inputs)) {
    it(`creates a stroke for "${key}" with default values.`, () => {
      const result = getStroke(value)

      expect(result).toMatchSnapshot('default_' + key)

      expect(
        result.find((t) => JSON.stringify(t).includes('null'))
      ).toBeUndefined()
    })

    describe('when testing random combinations of options', () => {
      for (let i = 0; i < 500; i++) {
        const options: StrokeOptions = {
          size: rng() * 100,
          thinning: rng(),
          streamline: rng(),
          smoothing: rng(),
          simulatePressure: rng() > -0.5,
          last: rng() > 0.5,
          start: {
            cap: rng() > 0,
            taper: rng() > 0 ? rng() * 100 : 0,
          },
          end: {
            cap: rng() > 0,
            taper: rng() > 0 ? rng() * 100 : 0,
          },
        }

        const result = getStroke(value, options)

        const optionsString = JSON.stringify(options, null, 2)

        it(`creates a stroke for "${key}" with options: ${optionsString}`, () => {
          expect(JSON.stringify(result).includes('null')).toBeFalsy()
        })

        it(`creates an SVG-pathable stroke for "${key}" with options: ${optionsString}`, () => {
          expect(getSvgPathFromStroke(result).includes('null')).toBeFalsy()
        })
      }
    })
  }

  it('gets stroke from a line with no points', () => {
    expect(getStroke([])).toMatchSnapshot('get-stroke-no-points')
  })

  it('gets stroke from a line with a single point', () => {
    expect(getStroke(onePoint)).toMatchSnapshot('get-stroke-one-point')
  })

  it('gets stroke from a line with two points', () => {
    expect(getStroke(twoPoints)).toMatchSnapshot('get-stroke-two-points')
  })

  it('gets stroke from a line with two equal points', () => {
    expect(getStroke(twoEqualPoints)).toMatchSnapshot(
      'get-stroke-two-equal-points'
    )
  })

  it('gets stroke from a line with a many points', () => {
    expect(getStroke(manyPoints)).toMatchSnapshot('get-stroke-many-points')
  })

  it('gets stroke from a line with with duplicates', () => {
    expect(getStroke(withDuplicates)).toMatchSnapshot(
      'get-stroke-with-duplicates'
    )
  })

  it('Caps points', () => {
    expect(getStroke(twoPoints).length > 4).toBeTruthy()
  })

  it('Succeeds on tricky points', () => {
    expect(JSON.stringify(getStroke(manyPoints)).includes('null')).toBeFalsy()
  })

  it('Solves a tricky stroke with only one point.', () => {
    const stroke = getStroke(onePoint, {
      size: 1,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
      last: false,
    })

    expect(stroke).toMatchSnapshot()

    expect(Number.isNaN([0][0])).toBe(false)
  })
})
