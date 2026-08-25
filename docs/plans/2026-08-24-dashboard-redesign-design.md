# Design Specification: D-Tech Beauty Vision Dashboard Redesign

## Goal
Redesign the main dashboard into a friendly, modern, and minimal user interface utilizing a **Soft Slate & Premium Glassmorphism** aesthetic. Additionally, identify and resolve the static camera status indicator bug in the Navbar.

---

## 1. Visual Design & Aesthetic System
We will update `src/index.css` to introduce a refined design system matching the user's preference:
* **Backgrounds**: Deep, rich dark slate (`#0b0f19`) replacing standard black or dark-gray.
* **Panels/Cards**: Translucent cards (`rgba(15, 23, 42, 0.45)`) with a blur backing (`backdrop-filter: blur(16px)`), thin slate-800 borders, and subtle glowing dropshadows.
* **Accent Colors**: Clean, premium cyan (`#06b6d4`), indigo (`#6366f1`), and emerald (`#10b981`) accents.
* **Typography**: Clean, friendly, modern sans-serif stack (using Inter-like system font defaults).
* **Interactions**: Smooth hover transitions, scale-up micro-animations on interactive cards, and warm gradient fills.

---

## 2. Redesigned Dashboard Structure
The new `DashboardView.tsx` will focus on friendliness and clarity:
1. **Welcome Header**: A warm, personal greeting ("Good day, analyzer" or similar friendly title) with a status badge showing the engine health.
2. **Simplified Metrics Grid**:
   * Metrics presented in clean, modern card layout with beautiful radial background glows.
   * Clear text descriptions instead of technical labels (e.g., "Analyses Logged" instead of "TOTAL LOCAL ANALYSES").
3. **Recent Activity Feed**:
   * A clean overview list showing the last 3-4 captured frames or uploads.
   * Quick action button to inspect or annotate directly from the dashboard.
4. **Primary Action Hub**:
   * Elegant, centered quick-start triggers ("Start Live Session" and "Analyze File") designed with soft gradients and friendly copy.

---

## 3. Bug Fixes & Architecture Changes
* **Dynamic Camera Status Synchronization**:
  * Currently, `App.tsx` hardcodes `cameraStatus = 'STOPPED'` and passes it to `Navbar.tsx`.
  * We will introduce a state `cameraStatus` in `App.tsx` and pass a state-setter down to `CameraView` or use a shared event/state synchronizer.
  * This allows the Navbar's status indicator to dynamically update to `CAMERA READY`, `NO CAMERA`, or `PERMISSION DENIED` in real-time as the camera starts or stops.

---

## 4. Verification Plan
* **Visual Inspection**: Validate the glassmorphism aesthetic, responsiveness, and hover effects in a browser window.
* **Unit Testing**: Run `npm run test` to verify no regressions in the core QA scoring modules.
* **Production Build**: Run `npm run build` to ensure clean TypeScript compilation.
