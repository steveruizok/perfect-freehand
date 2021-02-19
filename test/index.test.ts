import getPath from '../src'

describe('The function returns a string.', () => {
  it('works', () => {
    const path = getPath([
      [0, 0],
      [10, 0],
      [20, 0],
      [25, 5],
      [30, 5],
    ])
    expect(typeof path).toBe('string')
  })
})
