import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Point3D } from '../utils/geometry';

export interface FacialLandmarksResult {
  landmarks: Point3D[];
  faceCount: number;
  pose: {
    pitch: number; // up/down rotation in degrees
    yaw: number;   // left/right rotation in degrees
    roll: number;  // tilt in degrees
  };
  isAssessable: boolean;
  unassessableReason?: string;
}

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isInitializing = false;

/**
 * Initializes local MediaPipe FaceLandmarker instance
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (isInitializing) return null;

  isInitializing = true;
  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      '/wasm'
    );

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `/models/face_landmarker.task`,
        delegate: 'GPU',
      },
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
      runningMode: 'IMAGE',
      numFaces: 1,
    });
    isInitializing = false;
    return faceLandmarkerInstance;
  } catch (err) {
    console.error('Failed to initialize local MediaPipe FaceLandmarker:', err);
    isInitializing = false;
    return null;
  }
}

/**
 * Key landmark indices mapping for D-Tech 18 Face Regions
 */
export const LANDMARK_INDICES = {
  FACE_CONTOUR: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  LEFT_EYEBROW: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  RIGHT_EYEBROW: [336, 296, 334, 293, 300, 276, 283, 282, 295, 285],
  LEFT_EYE: [33, 160, 158, 133, 153, 144, 145, 159],
  RIGHT_EYE: [362, 385, 387, 263, 373, 380, 374, 386],
  LEFT_EYELINER: [33, 161, 160, 159, 158, 157, 173, 133],
  RIGHT_EYELINER: [362, 384, 385, 386, 387, 388, 398, 263],
  LEFT_LASH: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  RIGHT_LASH: [362, 382, 381, 380, 374, 373, 390, 249, 263],
  NOSE_BRIDGE: [168, 6, 197, 195, 5, 4],
  NOSE_TIP: [1, 2, 98, 327],
  UPPER_LIP: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191],
  LOWER_LIP: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
  LEFT_CHEEK: [116, 117, 118, 123, 147, 213, 192, 50, 187, 207],
  RIGHT_CHEEK: [345, 346, 347, 352, 376, 433, 416, 280, 411, 427],
  CHIN: [152, 148, 176, 149, 150, 136, 172, 377, 400, 378, 379],
  FOREHEAD: [10, 67, 109, 103, 54, 21, 162, 127, 234, 93, 132, 58],
  UNDER_EYE_LEFT: [111, 117, 118, 119, 120, 121, 128, 228],
  UNDER_EYE_RIGHT: [340, 346, 347, 348, 349, 350, 357, 448],
};

/**
 * Estimates head pose angles (pitch, yaw, roll) from landmark geometry
 */
export function estimateHeadPose(landmarks: Point3D[]): { pitch: number; yaw: number; roll: number } {
  if (!landmarks || landmarks.length < 468) {
    return { pitch: 0, yaw: 0, roll: 0 };
  }

  const noseTip = landmarks[1];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const chin = landmarks[152];
  const forehead = landmarks[10];

  // Yaw: left/right rotation based on nose tip offset relative to eye center
  const eyeCenter = {
    x: (leftEyeOuter.x + rightEyeOuter.x) / 2,
    y: (leftEyeOuter.y + rightEyeOuter.y) / 2,
  };
  const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
  const noseYawOffset = (noseTip.x - eyeCenter.x) / (eyeDistance || 0.001);
  const yaw = Math.round(noseYawOffset * 90);

  // Pitch: up/down rotation based on nose tip vertical relative to forehead/chin ratio
  const faceHeight = Math.abs(chin.y - forehead.y);
  const nosePitchOffset = ((noseTip.y - forehead.y) / (faceHeight || 0.001)) - 0.6;
  const pitch = Math.round(nosePitchOffset * 100);

  // Roll: tilt angle between eyes
  const dy = rightEyeOuter.y - leftEyeOuter.y;
  const dx = rightEyeOuter.x - leftEyeOuter.x;
  const roll = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

  return { pitch, yaw, roll };
}

/**
 * Validates face assessability according to pose and landmark clarity rules
 */
export function validateFaceAssessability(pose: { pitch: number; yaw: number; roll: number }): {
  isAssessable: boolean;
  status: 'READY FOR ANALYSIS' | 'LIMITED ANALYSIS' | 'NOT ASSESSABLE';
  reason?: string;
} {
  const absYaw = Math.abs(pose.yaw);
  const absPitch = Math.abs(pose.pitch);
  const absRoll = Math.abs(pose.roll);

  if (absYaw > 25) {
    return { isAssessable: false, status: 'NOT ASSESSABLE', reason: `Head rotated horizontally too far (${absYaw}° > 25°)` };
  }
  if (absPitch > 25) {
    return { isAssessable: false, status: 'NOT ASSESSABLE', reason: `Head tilted vertically too far (${absPitch}° > 25°)` };
  }
  if (absRoll > 30) {
    return { isAssessable: false, status: 'NOT ASSESSABLE', reason: `Head tilted sideways too far (${absRoll}° > 30°)` };
  }

  if (absYaw > 15 || absPitch > 15 || absRoll > 15) {
    return { isAssessable: true, status: 'LIMITED ANALYSIS', reason: `Minor head rotation detected (Yaw: ${absYaw}°, Pitch: ${absPitch}°, Roll: ${absRoll}°)` };
  }

  return { isAssessable: true, status: 'READY FOR ANALYSIS' };
}
