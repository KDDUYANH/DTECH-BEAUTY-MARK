import { describe, it, expect } from 'vitest';
import { calculateSymmetryRatio, distance2D } from '../src/utils/geometry';
import { analyzeEyebrow, analyzeEyeliner, analyzeHair } from '../src/scoring/makeupQA';

describe('D-Tech Local QA Engine Deterministic Math', () => {
  it('calculates Euclidean distance correctly', () => {
    const dist = distance2D({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(dist).toBe(5);
  });

  it('computes left-right symmetry ratio accurately', () => {
    const { ratio, diffPercentage } = calculateSymmetryRatio(10, 8);
    expect(ratio).toBeCloseTo(0.8);
    expect(diffPercentage).toBeCloseTo(20);
  });

  it('evaluates Eyebrow QA with OPTIMAL status when symmetric', () => {
    const mockRegionLeft = {
      key: 'left_eyebrow' as const,
      label: 'Left Eyebrow',
      polygon: [],
      boundingBox: { minX: 10, minY: 10, maxX: 50, maxY: 30, width: 40, height: 20 },
    };
    const mockRegionRight = {
      key: 'right_eyebrow' as const,
      label: 'Right Eyebrow',
      polygon: [],
      boundingBox: { minX: 100, minY: 10, maxX: 140, maxY: 30, width: 40, height: 20 },
    };

    const result = analyzeEyebrow(mockRegionLeft, mockRegionRight, true);
    expect(result.status).toBe('OPTIMAL');
    expect(result.score).toBe(100);
    expect(result.confidence).toBe(92);
  });

  it('triggers ERROR status for Eyeliner QA when asymmetry exceeds 20%', () => {
    const leftEyeliner = {
      key: 'left_eyeliner' as const,
      label: 'Left Eyeliner',
      polygon: [],
      boundingBox: { minX: 10, minY: 10, maxX: 30, maxY: 14.2, width: 20, height: 4.2 },
    };
    const rightEyeliner = {
      key: 'right_eyeliner' as const,
      label: 'Right Eyeliner',
      polygon: [],
      boundingBox: { minX: 100, minY: 10, maxX: 120, maxY: 15.3, width: 20, height: 5.3 },
    };

    const result = analyzeEyeliner(leftEyeliner, rightEyeliner, true);
    expect(result.status).toBe('ERROR');
    expect(result.severity).toBe('HIGH');
    expect(result.evidence).toContain('Right thickness');
  });

  it('returns NOT_ASSESSABLE status when face pose is unassessable', () => {
    const result = analyzeHair({} as any, false);
    expect(result.status).toBe('NOT_ASSESSABLE');
    expect(result.score).toBeNull();
  });
});
