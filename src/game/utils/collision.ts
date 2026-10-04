export interface RectangleBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface CircleCenter {
  x: number
  y: number
}

export function circlesIntersect(
  firstX: number,
  firstY: number,
  firstRadius: number,
  secondX: number,
  secondY: number,
  secondRadius: number,
) {
  const distanceX = firstX - secondX
  const distanceY = firstY - secondY
  const combinedRadius = firstRadius + secondRadius

  return distanceX ** 2 + distanceY ** 2 <= combinedRadius ** 2
}

export function getRotatedCircleCenters(
  x: number,
  y: number,
  rotation: number,
  offsets: readonly number[],
): CircleCenter[] {
  const forwardX = Math.sin(rotation)
  const forwardY = -Math.cos(rotation)

  return offsets.map((offset) => ({
    x: x + forwardX * offset,
    y: y + forwardY * offset,
  }))
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

export function expandRectangle(
  rectangle: RectangleBounds,
  amount: number,
): RectangleBounds {
  return {
    x: rectangle.x - amount,
    y: rectangle.y - amount,
    width: rectangle.width + amount * 2,
    height: rectangle.height + amount * 2,
  }
}

export function segmentIntersectsRectangle(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  rectangle: RectangleBounds,
) {
  const deltaX = endX - startX
  const deltaY = endY - startY
  let minimumTime = 0
  let maximumTime = 1

  const intersectsAxis = (
    start: number,
    delta: number,
    minimum: number,
    maximum: number,
  ) => {
    if (delta === 0) {
      return start >= minimum && start <= maximum
    }

    const firstTime = (minimum - start) / delta
    const secondTime = (maximum - start) / delta
    minimumTime = Math.max(minimumTime, Math.min(firstTime, secondTime))
    maximumTime = Math.min(maximumTime, Math.max(firstTime, secondTime))
    return minimumTime <= maximumTime
  }

  return (
    intersectsAxis(
      startX,
      deltaX,
      rectangle.x,
      rectangle.x + rectangle.width,
    ) &&
    intersectsAxis(
      startY,
      deltaY,
      rectangle.y,
      rectangle.y + rectangle.height,
    )
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}
