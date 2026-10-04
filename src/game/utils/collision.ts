export interface RectangleBounds {
  x: number
  y: number
  width: number
  height: number
}

export function circleIntersectsRectangle(
  circleX: number,
  circleY: number,
  circleRadius: number,
  rectangle: RectangleBounds,
) {
  const closestX = clamp(
    circleX,
    rectangle.x,
    rectangle.x + rectangle.width,
  )
  const closestY = clamp(
    circleY,
    rectangle.y,
    rectangle.y + rectangle.height,
  )
  const distanceX = circleX - closestX
  const distanceY = circleY - closestY

  return distanceX ** 2 + distanceY ** 2 <= circleRadius ** 2
}

export function insetRectangle(
  rectangle: RectangleBounds,
  inset: number,
): RectangleBounds {
  return {
    x: rectangle.x + inset,
    y: rectangle.y + inset,
    width: Math.max(0, rectangle.width - inset * 2),
    height: Math.max(0, rectangle.height - inset * 2),
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}
