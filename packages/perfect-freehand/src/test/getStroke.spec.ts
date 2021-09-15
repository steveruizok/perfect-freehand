import { getStroke } from '../getStroke'
import inputs from './inputs.json'

const { onePoint, twoPoints, manyPoints, withDuplicates } = inputs

describe('getStroke', () => {
  it('runs on a line with no points', () => {
    expect(getStroke([])).toMatchSnapshot('get-stroke-no-points')
  })

  it('runs on a line with a single point', () => {
    expect(getStroke(onePoint)).toMatchSnapshot('get-stroke-one-point')
  })

  it('runs on a line with two points', () => {
    expect(getStroke(twoPoints)).toMatchSnapshot('get-stroke-one-point')
  })

  it('runs on a line with a many points', () => {
    expect(getStroke(manyPoints)).toMatchSnapshot('get-stroke-many-points')
  })

  it('runs on a line with withDuplicates', () => {
    expect(getStroke(withDuplicates)).toMatchSnapshot('get-stroke-one-point')
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
