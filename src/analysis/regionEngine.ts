import { Point2D, Point3D, computeBoundingBox } from '../utils/geometry';
import { LANDMARK_INDICES } from '../vision/faceLandmarks';

export type RegionKey =
  | 'left_eyebrow'
  | 'right_eyebrow'
  | 'left_eye'
  | 'right_eye'
  | 'left_lash'
  | 'right_lash'
  | 'left_eyeliner'
  | 'right_eyeliner'
  | 'eyelid'
  | 'nose'
  | 'left_cheek'
  | 'right_cheek'
  | 'upper_lip'
  | 'lower_lip'
  | 'chin'
  | 'forehead'
  | 'under_eye'
  | 'face_contour';

export interface FaceRegionData {
  key: RegionKey;
  label: string;
  polygon: Point2D[];
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

/**
 * Maps 478 3D landmarks into 18 normalized 2D pixel coordinate region polygons
 */
export function extractFaceRegions(
  landmarks: Point3D[],
  canvasWidth: number,
  canvasHeight: number
): Record<RegionKey, FaceRegionData> {
  const getPoints = (indices: number[]): Point2D[] => {
    return indices.map((idx) => {
      const lm = landmarks[idx] || { x: 0.5, y: 0.5, z: 0 };
      return {
        x: lm.x * canvasWidth,
        y: lm.y * canvasHeight,
      };
    });
  };

  const createRegion = (key: RegionKey, label: string, indices: number[]): FaceRegionData => {
    const polygon = getPoints(indices);
    const box = computeBoundingBox(polygon);
    return { key, label, polygon, boundingBox: box };
  };

  return {
    left_eyebrow: createRegion('left_eyebrow', 'Left Eyebrow', LANDMARK_INDICES.LEFT_EYEBROW),
    right_eyebrow: createRegion('right_eyebrow', 'Right Eyebrow', LANDMARK_INDICES.RIGHT_EYEBROW),
    left_eye: createRegion('left_eye', 'Left Eye', LANDMARK_INDICES.LEFT_EYE),
    right_eye: createRegion('right_eye', 'Right Eye', LANDMARK_INDICES.RIGHT_EYE),
    left_lash: createRegion('left_lash', 'Left Eyelash', LANDMARK_INDICES.LEFT_LASH),
    right_lash: createRegion('right_lash', 'Right Eyelash', LANDMARK_INDICES.RIGHT_LASH),
    left_eyeliner: createRegion('left_eyeliner', 'Left Eyeliner', LANDMARK_INDICES.LEFT_EYELINER),
    right_eyeliner: createRegion('right_eyeliner', 'Right Eyeliner', LANDMARK_INDICES.RIGHT_EYELINER),
    eyelid: createRegion('eyelid', 'Eyelids', [...LANDMARK_INDICES.LEFT_EYE, ...LANDMARK_INDICES.RIGHT_EYE]),
    nose: createRegion('nose', 'Nose & Contour', [...LANDMARK_INDICES.NOSE_BRIDGE, ...LANDMARK_INDICES.NOSE_TIP]),
    left_cheek: createRegion('left_cheek', 'Left Blush Zone', LANDMARK_INDICES.LEFT_CHEEK),
    right_cheek: createRegion('right_cheek', 'Right Blush Zone', LANDMARK_INDICES.RIGHT_CHEEK),
    upper_lip: createRegion('upper_lip', 'Upper Lip', LANDMARK_INDICES.UPPER_LIP),
    lower_lip: createRegion('lower_lip', 'Lower Lip', LANDMARK_INDICES.LOWER_LIP),
    chin: createRegion('chin', 'Chin Zone', LANDMARK_INDICES.CHIN),
    forehead: createRegion('forehead', 'Forehead & Hairline', LANDMARK_INDICES.FOREHEAD),
    under_eye: createRegion('under_eye', 'Under Eye Zone', [...LANDMARK_INDICES.UNDER_EYE_LEFT, ...LANDMARK_INDICES.UNDER_EYE_RIGHT]),
    face_contour: createRegion('face_contour', 'Face Contour Base', LANDMARK_INDICES.FACE_CONTOUR),
  };
}
