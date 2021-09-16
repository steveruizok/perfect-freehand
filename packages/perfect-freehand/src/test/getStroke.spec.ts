import { getStroke } from '../getStroke'
import inputs from './inputs.json'

const { onePoint, twoPoints, twoEqualPoints, manyPoints, withDuplicates } =
  inputs

describe('getStroke', () => {
  for (const [key, value] of Object.entries(inputs)) {
    it(`runs ${key} without generating NaN values`, () => {
      expect(
        getStroke(value).find((t) => JSON.stringify(t).includes('null'))
      ).toBeUndefined()
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
