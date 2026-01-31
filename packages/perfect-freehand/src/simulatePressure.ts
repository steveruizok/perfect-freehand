import { RATE_OF_PRESSURE_CHANGE } from './constants'

const { min } = Math

/**
 * Simulate pressure based on the distance between points and stroke size.
 * This creates a natural-looking pressure effect based on drawing velocity.
 *
 * @param prevPressure The previous pressure value
 * @param distance The distance from the previous point
 * @param size The base stroke size
 * @returns The simulated pressure value (0-1)
 * @internal
 */
export function simulatePressure(
  prevPressure: number,
  distance: number,
  size: number
): number {
  // Speed of change - how fast should the pressure be changing?
  const sp = min(1, distance / size)
  // Rate of change - how much of a change is there?
  const rp = min(1, 1 - sp)
  // Accelerate the pressure
  return min(
    1,
    prevPressure + (rp - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE)
  )
}
