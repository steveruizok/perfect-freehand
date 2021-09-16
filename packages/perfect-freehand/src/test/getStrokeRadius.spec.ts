import { getStrokeRadius } from '../getStrokeRadius'

describe('getStrokeRadius', () => {
  /*
  A shape's stroke radius is determined by four parameters: size, thinning, easing, and pressure. At 0 thinning, the stroke radius will always be equal to half of size. If the thinning parameter is positive, then the stroke radius will increase as the pressure parameter increases. If the pressure parameter is negative, then the stroke radius will decrease as the pressure parameter increases. This can be further complicated by the easing function, which may transform a given pressure value into a new pressure.
  */

  describe('when thinning is zero', () => {
    it('uses half the size', () => {
      expect(getStrokeRadius(100, 0, 0)).toBe(50)
      expect(getStrokeRadius(100, 0, 0.25)).toBe(50)
      expect(getStrokeRadius(100, 0, 0.5)).toBe(50)
      expect(getStrokeRadius(100, 0, 0.75)).toBe(50)
      expect(getStrokeRadius(100, 0, 1)).toBe(50)
    })
  })

  describe('when thinning is positive', () => {
    it('scales between 25% and 75% at .5 thinning', () => {
      expect(getStrokeRadius(100, 0.5, 0)).toBe(25)
      expect(getStrokeRadius(100, 0.5, 0.25)).toBe(37.5)
      expect(getStrokeRadius(100, 0.5, 0.5)).toBe(50)
      expect(getStrokeRadius(100, 0.5, 0.75)).toBe(62.5)
      expect(getStrokeRadius(100, 0.5, 1)).toBe(75)
    })

    it('scales between 0% and 100% at 1 thinning', () => {
      expect(getStrokeRadius(100, 1, 0)).toBe(0)
      expect(getStrokeRadius(100, 1, 0.25)).toBe(25)
      expect(getStrokeRadius(100, 1, 0.5)).toBe(50)
      expect(getStrokeRadius(100, 1, 0.75)).toBe(75)
      expect(getStrokeRadius(100, 1, 1)).toBe(100)
    })
  })

  describe('when thinning is negative', () => {
    it('scales between 75% and 25% at -.5 thinning', () => {
      expect(getStrokeRadius(100, -0.5, 0)).toBe(75)
      expect(getStrokeRadius(100, -0.5, 0.25)).toBe(62.5)
      expect(getStrokeRadius(100, -0.5, 0.5)).toBe(50)
      expect(getStrokeRadius(100, -0.5, 0.75)).toBe(37.5)
      expect(getStrokeRadius(100, -0.5, 1)).toBe(25)
    })

    it('scales between 100% and 0% at -1 thinning', () => {
      expect(getStrokeRadius(100, -1, 0)).toBe(100)
      expect(getStrokeRadius(100, -1, 0.25)).toBe(75)
      expect(getStrokeRadius(100, -1, 0.5)).toBe(50)
      expect(getStrokeRadius(100, -1, 0.75)).toBe(25)
      expect(getStrokeRadius(100, -1, 1)).toBe(0)
    })
  })

  describe('when easing is exponential', () => {
    it('scales between 0% and 100% at 1 thinning', () => {
      expect(getStrokeRadius(100, 1, 0, (t) => t * t)).toBe(0)
      expect(getStrokeRadius(100, 1, 0.25, (t) => t * t)).toBe(6.25)
      expect(getStrokeRadius(100, 1, 0.5, (t) => t * t)).toBe(25)
      expect(getStrokeRadius(100, 1, 0.75, (t) => t * t)).toBe(56.25)
      expect(getStrokeRadius(100, 1, 1, (t) => t * t)).toBe(100)
    })

    it('scales between 100% and 0% at -1 thinning', () => {
      expect(getStrokeRadius(100, -1, 0, (t) => t * t)).toBe(100)
      expect(getStrokeRadius(100, -1, 0.25, (t) => t * t)).toBe(56.25)
      expect(getStrokeRadius(100, -1, 0.5, (t) => t * t)).toBe(25)
      expect(getStrokeRadius(100, -1, 0.75, (t) => t * t)).toBe(6.25)
      expect(getStrokeRadius(100, -1, 1, (t) => t * t)).toBe(0)
    })
  })
})
