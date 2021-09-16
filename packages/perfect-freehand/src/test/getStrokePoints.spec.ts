import { getStrokePoints } from '../getStrokePoints'
import inputs from './inputs.json'

const {
  onePoint,
  twoPoints,
  twoEqualPoints,
  numberPairs,
  objectPairs,
  manyPoints,
  withDuplicates,
} = inputs

describe('getStrokePoints', () => {
  for (const [key, value] of Object.entries(inputs)) {
    it(`runs ${key} without generating NaN values`, () => {
      expect(
        getStrokePoints(value).find((t) => JSON.stringify(t).includes('null'))
      ).toBeUndefined()
    })
  }

  it('get stroke points from a line with no points', () => {
    expect(getStrokePoints([])).toMatchSnapshot('get-stroke-points-no-points')
  })

  it('get stroke points from a line with a single point', () => {
    expect(getStrokePoints(onePoint)).toMatchSnapshot(
      'get-stroke-points-one-point'
    )
  })

  it('get stroke points from a line with two points', () => {
    expect(getStrokePoints(twoPoints)).toMatchSnapshot(
      'get-stroke-points-two-point'
    )
  })

  it('get stroke points from a line with two equal points', () => {
    expect(getStrokePoints(twoEqualPoints)).toMatchSnapshot(
      'get-stroke-points-two-equal-points'
    )
  })

  it('get stroke points from a line with a many points', () => {
    expect(getStrokePoints(manyPoints)).toMatchSnapshot(
      'get-stroke-points-many-points'
    )
  })

  it('get stroke points from a line with duplicates', () => {
    expect(getStrokePoints(withDuplicates)).toMatchSnapshot(
      'get-stroke-points-with-duplicates'
    )
  })

  it('get stroke points from a array input points', () => {
    expect(getStrokePoints(numberPairs)).toMatchSnapshot(
      'get-stroke-points-array-pairs'
    )
  })

  it('get stroke points from a object input points', () => {
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
