import type { StrokeOptions } from './types'
import { getStrokeOutlinePoints } from './getStrokeOutlinePoints'
import { getStrokePoints } from './getStrokePoints'

/**
 * ## getStroke
 * @description Get an array of points describing a polygon that surrounds the input points.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional in both cases.
 * @param options (optional) An object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 * @param options.start Tapering and easing function for the start of the line.
 * @param options.end Tapering and easing function for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
export function getStroke<T extends number[]>(
  points: T[],
  options?: StrokeOptions
): number[][]
export function getStroke<
  K extends { x: number; y: number; pressure?: number }
>(points: K[], options?: StrokeOptions): number[][]
export function getStroke<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options: StrokeOptions = {} as StrokeOptions): number[][] {
  return getStrokeOutlinePoints(getStrokePoints(points, options), options)
}
