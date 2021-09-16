import { getStrokePoints } from '../getStrokePoints'
import { getStrokeOutlinePoints } from '../getStrokeOutlinePoints'
import inputs from './inputs.json'

const { onePoint, twoPoints, twoEqualPoints, manyPoints, withDuplicates } =
  inputs

describe('getStrokeOutlinePoints', () => {
  for (const [key, value] of Object.entries(inputs)) {
    it(`runs ${key} without generating NaN values`, () => {
      expect(
        getStrokeOutlinePoints(getStrokePoints(value)).find((t) =>
          JSON.stringify(t).includes('null')
        )
      ).toBeUndefined()
    })
  }

  it('gets stroke outline points with a single point', () => {
    expect(getStrokeOutlinePoints(getStrokePoints(onePoint))).toMatchSnapshot(
      'get-stroke-outline-points-one-point'
    )
  })

  it('gets stroke outline points with two points', () => {
    expect(getStrokeOutlinePoints(getStrokePoints(twoPoints))).toMatchSnapshot(
      'get-stroke-outline-points-two-points'
    )
  })

  it('gets stroke outline points with two equal points', () => {
    expect(
      getStrokeOutlinePoints(getStrokePoints(twoEqualPoints)).find((t) =>
        JSON.stringify(t).includes('null')
      )
    ).toBeUndefined()

    expect(
      getStrokeOutlinePoints(getStrokePoints(twoEqualPoints))
    ).toMatchSnapshot('get-stroke-outline-points-two-equal-points')
  })

  it('gets stroke outline points on a line with a many points', () => {
    expect(getStrokeOutlinePoints(getStrokePoints(manyPoints))).toMatchSnapshot(
      'get-stroke-outline-points-many-points'
    )
  })

  it('gets stroke outline points with duplicates', () => {
    expect(
      getStrokeOutlinePoints(getStrokePoints(withDuplicates))
    ).toMatchSnapshot('get-stroke-outline-points-duplicates')
  })
})
