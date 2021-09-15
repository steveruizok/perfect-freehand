import { getStrokePoints } from '../getStrokePoints'
import { getStrokeOutlinePoints } from '../getStrokeOutlinePoints'
import inputs from './inputs.json'

const { onePoint, twoPoints, manyPoints, withDuplicates } = inputs

describe('getStrokeOutlinePoints', () => {
  it('runs on a line with a single point', () => {
    expect(getStrokeOutlinePoints(getStrokePoints(onePoint))).toMatchSnapshot(
      'get-stroke-outline-points-one-point'
    )
  })

  it('runs on a line with two points', () => {
    expect(getStrokeOutlinePoints(getStrokePoints(twoPoints))).toMatchSnapshot(
      'get-stroke-outline-points-one-point'
    )
  })

  it('runs on a line with a many points', () => {
    expect(getStrokeOutlinePoints(getStrokePoints(manyPoints))).toMatchSnapshot(
      'get-stroke-outline-points-many-points'
    )
  })

  it('runs on a line with withDuplicates', () => {
    expect(
      getStrokeOutlinePoints(getStrokePoints(withDuplicates))
    ).toMatchSnapshot('get-stroke-outline-points-one-point')
  })
})
