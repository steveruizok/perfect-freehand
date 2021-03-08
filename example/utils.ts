const { pow } = Math

export function cubicBezier(
  tx: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  // Inspired by Don Lancaster's two articles
  // http://www.tinaja.com/glib/cubemath.pdf
  // http://www.tinaja.com/text/bezmath.html

  // Set start and end point
  let x0 = 0,
    y0 = 0,
    x3 = 1,
    y3 = 1,
    // Convert the coordinates to equation space
    A = x3 - 3 * x2 + 3 * x1 - x0,
    B = 3 * x2 - 6 * x1 + 3 * x0,
    C = 3 * x1 - 3 * x0,
    D = x0,
    E = y3 - 3 * y2 + 3 * y1 - y0,
    F = 3 * y2 - 6 * y1 + 3 * y0,
    G = 3 * y1 - 3 * y0,
    H = y0,
    // Variables for the loop below
    t = tx,
    iterations = 5,
    i: number,
    slope: number,
    x: number,
    y: number

  // Loop through a few times to get a more accurate time value, according to the Newton-Raphson method
  // http://en.wikipedia.org/wiki/Newton's_method
  for (i = 0; i < iterations; i++) {
    // The curve's x equation for the current time value
    x = A * t * t * t + B * t * t + C * t + D

    // The slope we want is the inverse of the derivate of x
    slope = 1 / (3 * A * t * t + 2 * B * t + C)

    // Get the next estimated time value, which will be more accurate than the one before
    t -= (x - tx) * slope
    t = t > 1 ? 1 : t < 0 ? 0 : t
  }

  // Find the y value through the curve's y equation, with the now more accurate time value
  y = Math.abs(E * t * t * t + F * t * t + G * t * H)

  return y
}

export function copyToClipboard(string: string) {
  let textarea: HTMLTextAreaElement
  let result: any

  try {
    textarea = document.createElement('textarea')
    textarea.setAttribute('position', 'fixed')
    textarea.setAttribute('top', '0')
    textarea.setAttribute('readonly', 'true')
    textarea.setAttribute('contenteditable', 'true')
    textarea.style.position = 'fixed' // prevent scroll from jumping to the bottom when focus is set.
    textarea.value = string

    document.body.appendChild(textarea)

    textarea.focus()
    textarea.select()

    const range = document.createRange()
    range.selectNodeContents(textarea)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    textarea.setSelectionRange(0, textarea.value.length)
    result = document.execCommand('copy')
  } catch (err) {
    console.error(err)
    result = null
  } finally {
    document.body.removeChild(textarea)
  }

  // manual copy fallback using prompt
  if (!result) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const copyHotkey = isMac ? '⌘C' : 'CTRL+C'
    result = prompt(`Press ${copyHotkey}`, string) // eslint-disable-line no-alert
    if (!result) {
      return false
    }
  }
  return true
}

/**
 * Get a bezier curve data to for a spline that fits an array of points.
 * @param points An array of points formatted as [x, y]
 * @param k Tension
 * @returns An array of points as [cp1x, cp1y, cp2x, cp2y, px, py].
 */
export function getSpline(pts: number[][], k = 0.5, closed = false) {
  let p0: number[],
    [p1, p2, p3] = pts

  const results: number[][] = []

  for (let i = 1, len = pts.length; i < len; i++) {
    p0 = p1
    p1 = p2
    p2 = p3
    p3 = pts[i + 2] ? pts[i + 2] : p2
    results.push([
      p1[0] + ((p2[0] - p0[0]) / 6) * k,
      p1[1] + ((p2[1] - p0[1]) / 6) * k,
      p2[0] - ((p3[0] - p1[0]) / 6) * k,
      p2[1] - ((p3[1] - p1[1]) / 6) * k,
      pts[i][0],
      pts[i][1],
    ])
  }

  return results
}

export function getCurvePoints(
  pts: number[][],
  tension = 0.5,
  isClosed = false,
  numOfSegments = 3
) {
  let _pts = [...pts],
    len = pts.length,
    t1x: number, // tension vectors
    t2x: number,
    t1y: number,
    t2y: number,
    c1: number, // cardinal points
    c2: number,
    c3: number,
    c4: number,
    st: number,
    st2: number,
    st3: number,
    res = [] // results

  // The algorithm require a previous and next point to the actual point array.
  // Check if we will draw closed or open curve.
  // If closed, copy end points to beginning and first points to end
  // If open, duplicate first points to befinning, end points to end
  if (isClosed) {
    _pts.unshift(_pts[len - 1])
    _pts.push(_pts[0])
  } else {
    //copy 1. point and insert at beginning
    _pts.unshift(_pts[0])
    _pts.push(_pts[len - 1])
    // _pts.push(_pts[len - 1])
  }

  // For each point, calculate a segment
  for (let i = 1; i < _pts.length - 2; i++) {
    // Calculate points along segment and add to results
    for (let t = 0; t <= numOfSegments; t++) {
      // Step
      st = t / numOfSegments
      st2 = Math.pow(st, 2)
      st3 = Math.pow(st, 3)

      // Cardinals
      c1 = 2 * st3 - 3 * st2 + 1
      c2 = -(2 * st3) + 3 * st2
      c3 = st3 - 2 * st2 + st
      c4 = st3 - st2

      // Tension
      t1x = (_pts[i + 1][0] - _pts[i - 1][0]) * tension
      t2x = (_pts[i + 2][0] - _pts[i][0]) * tension
      t1y = (_pts[i + 1][1] - _pts[i - 1][1]) * tension
      t2y = (_pts[i + 2][1] - _pts[i][1]) * tension

      // Control points
      res.push([
        c1 * _pts[i][0] + c2 * _pts[i + 1][0] + c3 * t1x + c4 * t2x,
        c1 * _pts[i][1] + c2 * _pts[i + 1][1] + c3 * t1y + c4 * t2y,
      ])
    }
  }

  res.push(pts[pts.length - 1])

  return res
}

interface SplineOptions {
  duration?: number
  sharpness?: number
  centers?: number[][]
  controls?: number
  stepLength?: number
}

export default class Spline {
  public points: number[][]
  public duration: number
  public sharpness: number
  public centers: number[][]
  public controls: number[][][]
  public stepLength: number
  public length: number
  public delay: number
  public steps: number[]

  constructor(points: number[][] = [], options = {} as SplineOptions) {
    this.points = points
    this.duration = options.duration || 10000
    this.sharpness = options.sharpness || 0.85
    this.centers = []
    this.controls = []
    this.stepLength = options.stepLength || 60
    this.length = this.points.length
    this.delay = 0

    for (let i = 0; i < this.length - 1; i++) {
      const p1 = this.points[i]
      const p2 = this.points[i + 1]
      this.centers.push([(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2])
    }

    this.controls.push([this.points[0], this.points[0]])

    for (let i = 0; i < this.centers.length - 1; i++) {
      const dx =
        this.points[i + 1][0] -
        (this.centers[i][0] + this.centers[i + 1][0]) / 2
      const dy =
        this.points[i + 1][1] -
        (this.centers[i][1] + this.centers[i + 1][1]) / 2
      this.controls.push([
        [
          (1.0 - this.sharpness) * this.points[i + 1][0] +
            this.sharpness * (this.centers[i][0] + dx),

          (1.0 - this.sharpness) * this.points[i + 1][1] +
            this.sharpness * (this.centers[i][1] + dy),
        ],
        [
          (1.0 - this.sharpness) * this.points[i + 1][0] +
            this.sharpness * (this.centers[i + 1][0] + dx),

          (1.0 - this.sharpness) * this.points[i + 1][1] +
            this.sharpness * (this.centers[i + 1][1] + dy),
        ],
      ])
    }

    this.controls.push([
      this.points[this.length - 1],
      this.points[this.length - 1],
    ])

    this.steps = this.cacheSteps(this.stepLength)
    return this
  }
  /**
   * Caches an array of equidistant (more or less) points on the curve.
   */
  public cacheSteps(mindist: number) {
    const steps = []
    let laststep = this.pos(0)
    steps.push(0)
    for (let t = 0; t < this.duration; t += 10) {
      const step = this.pos(t)
      const dist = Math.sqrt(
        (step[0] - laststep[0]) * (step[0] - laststep[0]) +
          (step[1] - laststep[1]) * (step[1] - laststep[1])
      )
      if (dist > mindist) {
        steps.push(t)
        laststep = step
      }
    }
    return steps
  }

  /**
   * returns angle and speed in the given point in the curve
   */
  public vector(t: number) {
    const p1 = this.pos(t + 10)
    const p2 = this.pos(t - 10)
    return {
      angle: (180 * Math.atan2(p1[1] - p2[1], p1[0] - p2[0])) / 3.14,
      speed: Math.sqrt(
        (p2[0] - p1[0]) * (p2[0] - p1[0]) +
          (p2[1] - p1[1]) * (p2[1] - p1[1]) +
          (p2[2] - p1[2]) * (p2[2] - p1[2])
      ),
    }
  }

  /**
   * Gets the position of the point, given time.
   *
   * WARNING: The speed is not constant. The time it takes between control points is constant.
   *
   * For constant speed, use Spline.steps[i];
   */
  public pos(time: number) {
    let t = time - this.delay
    if (t < 0) {
      t = 0
    }
    if (t > this.duration) {
      t = this.duration - 1
    }
    // t = t-this.delay;
    const t2 = t / this.duration
    if (t2 >= 1) {
      return this.points[this.length - 1]
    }

    const n = Math.floor((this.points.length - 1) * t2)
    const t1 = (this.length - 1) * t2 - n
    return bezier(
      t1,
      this.points[n],
      this.controls[n][1],
      this.controls[n + 1][0],
      this.points[n + 1]
    )
  }
}

function B(t: number) {
  const t2 = t * t
  const t3 = t2 * t
  return [
    t3,
    3 * t2 * (1 - t),
    3 * t * (1 - t) * (1 - t),
    (1 - t) * (1 - t) * (1 - t),
  ]
}

function bezier(
  t: number,
  p1: number[],
  c1: number[],
  c2: number[],
  p2: number[]
) {
  const b = B(t)
  const pos = [
    p2[0] * b[0] + c2[0] * b[1] + c1[0] * b[2] + p1[0] * b[3],
    p2[1] * b[0] + c2[1] * b[1] + c1[1] * b[2] + p1[1] * b[3],
  ]
  return pos
}

export function getBSpline(
  points: number[][],
  resolution = 60,
  sharpness = 0.85
) {
  const coords = []
  const spline = new Spline(points, {
    duration: resolution,
    sharpness,
  })

  for (let i = 0; i < spline.duration; i += 10) {
    const pos = spline.pos(i)
    if (Math.floor(i / 100) % 2 === 0) {
      coords.push(pos)
    }
  }
  return coords
}

export function getBezierCurveSegments(points: number[][], tension = 0.4) {
  const len = points.length,
    cpoints: number[][] = [...points]

  if (len < 2) {
    throw Error('Curve must have at least two points.')
  }

  for (let i = 1; i < len - 1; i++) {
    let p0 = points[i - 1],
      p1 = points[i],
      p2 = points[i + 1]

    const pdx = p2[0] - p0[0],
      pdy = p2[1] - p0[1],
      pd = Math.hypot(pdx, pdy),
      nx = pdx / pd, // normalized x
      ny = pdy / pd, // normalized y
      dp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), // Distance to previous
      dn = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) // Distance to next

    cpoints[i] = [
      // tangent start
      p1[0] - nx * dp * tension,
      p1[1] - ny * dp * tension,
      // tangent end
      p1[0] + nx * dn * tension,
      p1[1] + ny * dn * tension,
      // normal
      nx,
      ny,
    ]
  }

  // TODO: Reflect the nearest control points, not average them
  const d0 = Math.hypot(points[0][0] + cpoints[1][0])
  cpoints[0][2] = (points[0][0] + cpoints[1][0]) / 2
  cpoints[0][3] = (points[0][1] + cpoints[1][1]) / 2
  cpoints[0][4] = (cpoints[1][0] - points[0][0]) / d0
  cpoints[0][5] = (cpoints[1][1] - points[0][1]) / d0

  const d1 = Math.hypot(points[len - 1][1] + cpoints[len - 1][1])
  cpoints[len - 1][0] = (points[len - 1][0] + cpoints[len - 2][2]) / 2
  cpoints[len - 1][1] = (points[len - 1][1] + cpoints[len - 2][3]) / 2
  cpoints[len - 1][4] = (cpoints[len - 2][2] - points[len - 1][0]) / -d1
  cpoints[len - 1][5] = (cpoints[len - 2][3] - points[len - 1][1]) / -d1

  const results: {
    start: number[]
    tangentStart: number[]
    normalStart: number[]
    pressureStart: number
    end: number[]
    tangentEnd: number[]
    normalEnd: number[]
    pressureEnd: number
  }[] = []

  for (let i = 1; i < cpoints.length; i++) {
    results.push({
      start: points[i - 1].slice(0, 2),
      tangentStart: cpoints[i - 1].slice(2, 4),
      normalStart: cpoints[i - 1].slice(4, 6),
      pressureStart: 2 + ((i - 1) % 2 === 0 ? 1.5 : 0),
      end: points[i].slice(0, 2),
      tangentEnd: cpoints[i].slice(0, 2),
      normalEnd: cpoints[i].slice(4, 6),
      pressureEnd: 2 + (i % 2 === 0 ? 1.5 : 0),
    })
  }

  console.log(results)

  return results
}
