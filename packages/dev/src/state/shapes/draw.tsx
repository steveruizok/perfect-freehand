import * as React from 'react'
import {
  TLBounds,
  Utils,
  TLTransformInfo,
  TLShapeUtil,
  SVGContainer,
} from '@tldraw/core'
import {
  intersectBoundsBounds,
  intersectBoundsPolyline,
} from '@tldraw/intersect'
import { Vec } from '@tldraw/vec'
import { getStroke } from 'perfect-freehand'
import type { DrawShape } from '../../types'
import { EASINGS } from '../easings'

type T = DrawShape
type E = SVGSVGElement

export class DrawUtil extends TLShapeUtil<T, E> {
  type = 'draw' as const

  pointsBoundsCache = new WeakMap<T['points'], TLBounds>([])

  rotatedCache = new WeakMap<T, number[][]>([])

  strokeCache = new WeakMap<T, number[][]>([])

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'id',
        type: 'draw',
        name: 'Draw',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        points: [[0, 0, 0.5]],
        rotation: 0,
        isDone: false,
        style: {
          size: 8,
          strokeWidth: 0,
          thinning: 0.75,
          streamline: 0.5,
          smoothing: 0.5,
          easing: 'linear',
          taperStart: 0,
          taperEnd: 0,
          capStart: true,
          capEnd: true,
          easingStart: 'linear',
          easingEnd: 'linear',
          isFilled: true,
          stroke: 'black',
          fill: 'black',
        },
      },
      props
    )
  }

  Component = TLShapeUtil.Component<T, E>(({ shape, events }, ref) => {
    const {
      style: {
        size,
        thinning,
        strokeWidth,
        streamline,
        smoothing,
        easing,
        taperStart,
        taperEnd,
        capStart,
        capEnd,
        easingEnd,
        easingStart,
        stroke,
        fill,
        isFilled,
      },
      isDone,
    } = shape

    const simulatePressure = shape.points[2]?.[2] === 0.5

    const outlinePoints = Utils.getFromCache(this.strokeCache, shape, () =>
      getStroke(shape.points, {
        size,
        thinning,
        streamline,
        easing: EASINGS[easing],
        smoothing,
        start: {
          taper: taperStart,
          cap: capStart,
          easing: EASINGS[easingStart],
        },
        end: {
          taper: taperEnd,
          cap: capEnd,
          easing: EASINGS[easingEnd],
        },
        simulatePressure,
        last: isDone,
      })
    )

    const drawPathData = getSvgPathFromStroke(outlinePoints)

    return (
      <SVGContainer ref={ref} fr="" {...events}>
        {strokeWidth ? (
          <path
            d={drawPathData}
            id={'path_stroke_' + shape.id}
            fill={'transparent'}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="all"
          />
        ) : null}
        {
          <path
            id={'path_' + shape.id}
            d={drawPathData}
            fill={isFilled ? fill : 'transparent'}
            stroke={isFilled || strokeWidth > 0 ? 'transparent' : 'black'}
            strokeWidth={isFilled || strokeWidth > 0 ? 0 : 1}
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="all"
          />
        }
      </SVGContainer>
    )
  })

  Indicator = TLShapeUtil.Indicator<T>(() => {
    return <g />
  })

  create = (props: { id: string } & Partial<T>) => {
    this.refMap.set(props.id, React.createRef())
    return this.getShape(props)
  }

  getBounds = (shape: DrawShape): TLBounds => {
    const bounds = Utils.translateBounds(
      Utils.getFromCache(this.pointsBoundsCache, shape.points, () =>
        Utils.getBoundsFromPoints(shape.points)
      ),
      shape.point
    )

    return bounds
  }

  hitTestBounds = (shape: DrawShape, brushBounds: TLBounds): boolean => {
    // Test axis-aligned shape
    if (!shape.rotation) {
      const bounds = this.getBounds(shape)

      return (
        Utils.boundsContain(brushBounds, bounds) ||
        ((Utils.boundsContain(bounds, brushBounds) ||
          intersectBoundsBounds(bounds, brushBounds).length > 0) &&
          intersectBoundsPolyline(
            Utils.translateBounds(brushBounds, Vec.neg(shape.point)),
            shape.points
          ).length > 0)
      )
    }

    // Test rotated shape
    const rBounds = this.getRotatedBounds(shape)

    const rotatedBounds = Utils.getFromCache(this.rotatedCache, shape, () => {
      const c = Utils.getBoundsCenter(Utils.getBoundsFromPoints(shape.points))
      return shape.points.map((pt) => Vec.rotWith(pt, c, shape.rotation || 0))
    })

    return (
      Utils.boundsContain(brushBounds, rBounds) ||
      intersectBoundsPolyline(
        Utils.translateBounds(brushBounds, Vec.neg(shape.point)),
        rotatedBounds
      ).length > 0
    )
  }

  transform = (
    shape: DrawShape,
    bounds: TLBounds,
    { initialShape, scaleX, scaleY }: TLTransformInfo<DrawShape>
  ): Partial<DrawShape> => {
    const initialShapeBounds = Utils.getFromCache(
      this.boundsCache,
      initialShape,
      () => Utils.getBoundsFromPoints(initialShape.points)
    )

    const points = initialShape.points.map(([x, y, r]) => {
      return [
        bounds.width *
          (scaleX < 0 // * sin?
            ? 1 - x / initialShapeBounds.width
            : x / initialShapeBounds.width),
        bounds.height *
          (scaleY < 0 // * cos?
            ? 1 - y / initialShapeBounds.height
            : y / initialShapeBounds.height),
        r,
      ]
    })

    const newBounds = Utils.getBoundsFromPoints(shape.points)

    const point = Vec.sub(
      [bounds.minX, bounds.minY],
      [newBounds.minX, newBounds.minY]
    )

    return {
      points,
      point,
    }
  }
}

const average = (a: number, b: number) => (a + b) / 2

/**
 * Turn an array of points into a path of quadradic curves.
 *
 * @param points The points returned from perfect-freehand
 * @param closed Whether the stroke is closed
 */
export function getSvgPathFromStroke(
  points: number[][],
  closed = true
): string {
  const len = points.length

  if (len < 4) {
    return ``
  }

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1]
  ).toFixed(2)} T`

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i]
    b = points[i + 1]
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
      2
    )} `
  }

  if (closed) {
    result += 'Z'
  }

  return result
}

export function dot([x, y]: number[]) {
  return `M ${x - 0.5},${y} a .5,.5 0 1,0 1,0 a .5,.5 0 1,0 -1,0`
}

export function dots(points: number[][]) {
  return points.map(dot).join(' ')
}

export const draw = new DrawUtil()
