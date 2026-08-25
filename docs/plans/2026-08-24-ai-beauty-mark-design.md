# Design Specification: Phase 16 — AI Beauty Mark Local Engine

## Goal
Build the local AI Beauty Mark scoring layer on top of the existing deterministic computer vision engine. This architecture introduces normalized feature extraction, an AI model interface, a score fusion layer, a human-AI correction feedback loop, and an active learning queue, while keeping 100% offline local privacy.

---

## 1. Directory Structure Updates
We will introduce the following files and directories:
* `models/` [NEW]: Stores local model descriptors and manifests.
  * `models/manifest.json` [NEW]: Schema status and metadata info.
  * `models/beauty-mark/current.json` [NEW]: Active local model configurations.
* `src/analysis/featureEngine.ts` [NEW]: Normalizes face measurements into centralized features.
* `src/ai/modelInterface.ts` [NEW]: Standardized interfaces and contracts (`loadModel`, `predict`, etc.).
* `src/ai/fusionEngine.ts` [NEW]: Combines deterministic and ML scores with confidence weights.
* `src/pages/ModelLabView.tsx` [NEW]: Displays training readiness, learning queue, and manifest options under MORE -> ADVANCED.

---

## 2. Technical Design

### A. Normalized Feature Extraction (`featureEngine.ts`)
* Extracts quantitative metrics from landmarks and canvas-derived color statistics.
* Normalizes all values into a `0.0` to `1.0` (or `0` to `100`) range.
* Assigns `featureSchemaVersion = "feature-schema-v0.1"`.
* Centralized Feature Schema keys:
  * `eyeliner.thickness_delta`: Difference between left and right eyeliner height.
  * `eyebrow.height_delta`: Vertical center difference between left and right brows.
  * `blush.intensity_balance`: Symmetry of mean red channel values.
  * `lips.symmetry_deviation`: Offset between center of lips and nose-chin axis.
  * `base.texture_variance`: StdDev of skin luminance (indicator of smoothness/cakeyness).
  * `hair.volume_proxy`: Estimated boundary size.

### B. AI Model Interface & ONNX Adapter (`modelInterface.ts`)
* Implements a standard contract:
  ```typescript
  export interface AIModel {
    id: string;
    version: string;
    status: 'RULE_ENGINE_ONLY' | 'ML_MODEL_NOT_TRAINED' | 'MODEL_READY' | 'MODEL_ERROR';
    predict(features: Record<string, number>): Promise<{ score: number; confidence: number }>;
  }
  ```
* Fallback to deterministic rules when no trained ML weights exist (outputs `ML_MODEL_NOT_TRAINED`).
* Zero remote network requests. All assets are loaded locally.

### C. Score Fusion Layer (`fusionEngine.ts`)
* When ML is unavailable: `Final Score = Deterministic Score`.
* When ML is available: `Final Score = (Deterministic * (1 - ML_Confidence)) + (ML_Score * ML_Confidence)`.
* Clearly exposes source flags: `RULE-BASED RESULT` or `HYBRID RESULT`.

### D. Human Correction delta & Active Learning Queue
* Compares `AI Score` and `Human Review Score` to calculate `absoluteScoreDelta`.
* Sets `learningValue` to `HIGH` if delta > 10, `MEDIUM` if delta > 5, and `LOW` otherwise.
* High-value correction samples are indexed in the learning queue for future model training.
* Validates training readiness: checks if validated samples >= 500.

---

## 3. UI/UX Panel Additions
* **Dashboard Panel**: Add a minimal card showing `AI BEAUTY MARK` index, source status (e.g. `● RULE`), and confidence.
* **Model Lab**: Hidden under `MORE -> ADVANCED`. Shows local model status, manifest JSON, validated sample count, and active learning queue table.
* **Enhance & Recheck Controls**:
  * `[Recheck]`: Re-runs predictions on the same active session frame without creating duplicates.
  * `[Enhance Analysis]`: Refines landmark bounding boundaries and recalibrates color statistics before re-running.

---

## 4. Verification Plan
* **Vitest Suite**: Add unit tests verifying feature normalization ranges, score fusion math under various confidence values, and learning queue prioritizing logic.
* **TypeScript Compilation**: Run `npm run build` to confirm zero build regressions.
