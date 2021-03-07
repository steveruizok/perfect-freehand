import getPath from '../src'

describe('It works with number pairs.', () => {
  it('works', () => {
    const stroke = getPath([
      [0, 0],
      [10, 0],
      [20, 0],
      [25, 5],
      [30, 5],
    ])
    expect(Array.isArray(stroke)).toBeTruthy
  })
})

describe('It works with point pairs.', () => {
  it('works', () => {
    const stroke = getPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 25, y: 5 },
      { x: 30, y: 5 },
    ])
    expect(Array.isArray(stroke)).toBeTruthy
  })
})

describe('It produces the same result with either input.', () => {
  it('works', () => {
    const strokeA = getPath([
      [0, 0],
      [10, 0],
      [20, 0],
      [25, 5],
      [30, 5],
    ])
    const strokeB = getPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 25, y: 5 },
      { x: 30, y: 5 },
    ])
    expect(JSON.stringify(strokeA) === JSON.stringify(strokeB)).toBeTruthy
  })
})
