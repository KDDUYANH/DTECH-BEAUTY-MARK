export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculates Euclidean distance between 2 points
 */
export function distance2D(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates midpoint between 2 points
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculates slope/angle in degrees between 2 points
 */
export function angleBetween(p1: Point2D, p2: Point2D): number {
  const rad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  return (rad * 180) / Math.PI;
}

/**
 * Calculates symmetry ratio between left and right metrics (0.0 to 1.0, 1.0 being 100% symmetric)
 */
export function calculateSymmetryRatio(leftVal: number, rightVal: number): { ratio: number; diffPercentage: number } {
  if (leftVal === 0 && rightVal === 0) return { ratio: 1.0, diffPercentage: 0 };
  const maxVal = Math.max(Math.abs(leftVal), Math.abs(rightVal));
  if (maxVal === 0) return { ratio: 1.0, diffPercentage: 0 };
  const diff = Math.abs(leftVal - rightVal);
  const diffPercentage = (diff / maxVal) * 100;
  const ratio = Math.max(0, 1 - diff / maxVal);
  return { ratio, diffPercentage };
}

/**
 * Computes bounding box for a array of 2D points
 */
export function computeBoundingBox(points: Point2D[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

/**
 * Calculates RGB statistics (mean, stddev) for a Canvas region
 */
export function calculateRegionColorStats(
  ctx: CanvasRenderingContext2D,
  box: { minX: number; minY: number; width: number; height: number }
): { meanR: number; meanG: number; meanB: number; variance: number; stdDev: number } {
  const width = Math.max(1, Math.floor(box.width));
  const height = Math.max(1, Math.floor(box.height));
  const startX = Math.max(0, Math.floor(box.minX));
  const startY = Math.max(0, Math.floor(box.minY));

  try {
    const imageData = ctx.getImageData(startX, startY, width, height);
    const data = imageData.data;
    let sumR = 0, sumG = 0, sumB = 0;
    const pixelCount = data.length / 4;

    if (pixelCount === 0) {
      return { meanR: 0, meanG: 0, meanB: 0, variance: 0, stdDev: 0 };
    }

    for (let i = 0; i < data.length; i += 4) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
    }

    const meanR = sumR / pixelCount;
    const meanG = sumG / pixelCount;
    const meanB = sumB / pixelCount;

    // Luminance variance calculation (for texture / cakey foundation assessment)
    let varianceSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const meanLum = 0.299 * meanR + 0.587 * meanG + 0.114 * meanB;
      varianceSum += Math.pow(lum - meanLum, 2);
    }

    const variance = varianceSum / pixelCount;
    const stdDev = Math.sqrt(variance);

    return { meanR, meanG, meanB, variance, stdDev };
  } catch (e) {
    console.warn('Canvas read error during color stat calculation:', e);
    return { meanR: 0, meanG: 0, meanB: 0, variance: 0, stdDev: 0 };
  }
}
