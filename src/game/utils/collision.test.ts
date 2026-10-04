import { describe, expect, it } from 'vitest'
import { circleIntersectsRectangle, insetRectangle } from './collision'

const RECTANGLE = { x: 100, y: 100, width: 80, height: 60 }

describe('circleIntersectsRectangle', () => {
  it('detects a circle touching an edge', () => {
    expect(circleIntersectsRectangle(90, 130, 10, RECTANGLE)).toBe(true)
  })

  it('does not collide when the circle is outside the rectangle', () => {
    expect(circleIntersectsRectangle(80, 130, 10, RECTANGLE)).toBe(false)
  })

  it('detects collision near a rectangle corner using real distance', () => {
    expect(circleIntersectsRectangle(94, 94, 9, RECTANGLE)).toBe(true)
    expect(circleIntersectsRectangle(90, 90, 9, RECTANGLE)).toBe(false)
  })
})

describe('insetRectangle', () => {
  it('shrinks the rectangle equally on every side', () => {
    expect(insetRectangle(RECTANGLE, 10)).toEqual({
      x: 110,
      y: 110,
      width: 60,
      height: 40,
    })
  })
})
