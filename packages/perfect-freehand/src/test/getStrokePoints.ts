import { getStrokePoints } from '../getStrokePoints'
import inputs from './inputs.json'

const {
  numberPairs,
  objectPairs,
  onePoint,
  twoPoints,
  manyPoints,
  withDuplicates,
} = inputs

describe('getStrokePoints', () => {
  it('runs on a line with no points', () => {
    expect(getStrokePoints([])).toMatchSnapshot('get-stroke-points-no-points')
  })

  it('runs on a line with a single point', () => {
    expect(getStrokePoints(onePoint)).toMatchSnapshot(
      'get-stroke-points-one-point'
    )
  })

  it('runs on a line with two points', () => {
    expect(getStrokePoints(twoPoints)).toMatchSnapshot(
      'get-stroke-points-two-point'
    )
  })

  it('runs on a line with a many points', () => {
    expect(getStrokePoints(manyPoints)).toMatchSnapshot(
      'get-stroke-points-many-points'
    )
  })

  it('runs on a line with withDuplicates', () => {
    expect(getStrokePoints(withDuplicates)).toMatchSnapshot(
      'get-stroke-points-with-duplicates'
    )
  })

  it('runs on array input points', () => {
    expect(getStrokePoints(numberPairs)).toMatchSnapshot(
      'get-stroke-points-array-pairs'
    )
  })

  it('runs on object input points', () => {
    expect(getStrokePoints(objectPairs)).toMatchSnapshot(
      'get-stroke-points-object-pairs'
    )
  })

  it('computes same result for both input types', () => {
    expect(JSON.stringify(getStrokePoints(objectPairs))).toStrictEqual(
      JSON.stringify(getStrokePoints(objectPairs))
    )
  })
})
