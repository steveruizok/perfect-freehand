import * as React from 'react'
import {
  TLBounds,
  Utils,
  TLTransformInfo,
  ShapeUtil,
  SVGContainer,
} from '@tldraw/core'
import {
  intersectBoundsBounds,
  intersectBoundsPolyline,
} from '@tldraw/intersect'
import { Vec } from '@tldraw/vec'
import { getStroke, getStrokePoints } from 'perfect-freehand'
import type { DrawShape } from '../../types'

const pointsBoundsCache = new WeakMap<DrawShape['points'], TLBounds>([])
const rotatedCache = new WeakMap<DrawShape, number[][]>([])

export const Draw = new ShapeUtil<DrawShape, SVGSVGElement>(() => ({
  type: 'draw',

  defaultProps: {
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
      taperStart: 0,
      taperEnd: 0,
      capStart: true,
      capEnd: true,
      isFilled: true,
      stroke: 'black',
      fill: 'black',
    },
  },

  Component({ shape, events }, ref) {
    const {
      style: {
        size,
        thinning,
        strokeWidth,
        streamline,
        smoothing,
        taperStart,
        taperEnd,
        capStart,
        capEnd,
        stroke,
        fill,
        isFilled,
      },
      isDone,
    } = shape

    const simulatePressure = shape.points[2]?.[2] === 0.5

    const drawPathData = getSvgPathFromStroke(
      getStroke(shape.points, {
        size,
        thinning,
        streamline,
        smoothing,
        end: { taper: taperEnd, cap: capEnd },
        start: { taper: taperStart, cap: capStart },
        simulatePressure,
        last: isDone,
        easing: (t) => t,
      })
    )

    return (
      <SVGContainer ref={ref} {...events}>
        {strokeWidth && (
          <path
            d={drawPathData}
            fill={'transparent'}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="all"
          />
        )}
        {
          <path
            d={drawPathData}
            fill={isFilled ? fill : 'transparent'}
            stroke={isFilled || strokeWidth > 0 ? 'transparent' : 'black'}
            strokeWidth={1}
            strokeLinejoin="round"
            strokeLinecap="round"
            pointerEvents="all"
          />
        }
      </SVGContainer>
    )
  },

  Indicator({ shape }) {
    const { points } = shape

    const path = Utils.getFromCache(this.simplePathCache, points, () =>
      getSolidStrokePath(shape)
    )

    return <path d={path} />
  },

  getBounds(shape: DrawShape): TLBounds {
    return Utils.translateBounds(
      Utils.getFromCache(pointsBoundsCache, shape.points, () =>
        Utils.getBoundsFromPoints(shape.points)
      ),
      shape.point
    )
  },

  shouldRender(prev: DrawShape, next: DrawShape): boolean {
    return next.points !== prev.points || next.style !== prev.style
  },

  hitTestBounds(shape: DrawShape, brushBounds: TLBounds): boolean {
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

    const rotatedBounds = Utils.getFromCache(rotatedCache, shape, () => {
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
  },

  transform(
    shape: DrawShape,
    bounds: TLBounds,
    { initialShape, scaleX, scaleY }: TLTransformInfo<DrawShape>
  ): Partial<DrawShape> {
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
  },
}))

function getSolidStrokePath(shape: DrawShape) {
  let { points } = shape

  let len = points.length

  if (len === 0) return 'M 0 0 L 0 0'
  if (len < 3) return `M ${points[0][0]} ${points[0][1]}`

  points = getStrokePoints(points).map((pt) => pt.point)

  len = points.length

  const d = points.reduce(
    (acc, [x0, y0], i, arr) => {
      if (i === len - 1) {
        acc.push('L', x0, y0)
        return acc
      }

      const [x1, y1] = arr[i + 1]
      acc.push(
        x0.toFixed(2),
        y0.toFixed(2),
        ((x0 + x1) / 2).toFixed(2),
        ((y0 + y1) / 2).toFixed(2)
      )
      return acc
    },
    ['M', points[0][0], points[0][1], 'Q']
  )

  const path = d.join(' ').replaceAll(/(\s[0-9]*\.[0-9]{2})([0-9]*)\b/g, '$1')

  return path
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''

  const max = stroke.length - 1

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      if (i === max) return acc
      const [x1, y1] = arr[i + 1]
      acc.push(` ${x0},${y0} ${(x0 + x1) / 2},${(y0 + y1) / 2}`)
      return acc
    },
    ['M ', `${stroke[0][0]},${stroke[0][1]}`, ' Q']
  )

  return d
    .concat('Z')
    .join('')
    .replaceAll(/(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g, '$1')
}
