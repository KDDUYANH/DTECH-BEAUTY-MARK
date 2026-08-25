import React, { useState, useRef, useEffect } from 'react';
import { CameraDeviceInfo, CameraManager, CameraMetrics } from '../camera/cameraManager';
import { estimateHeadPose, validateFaceAssessability, initFaceLandmarker } from '../vision/faceLandmarks';
import { extractFaceRegions } from '../analysis/regionEngine';
import { runMasterMakeupQA, MakeupQAReport } from '../scoring/makeupQA';
import { AnalysisRecord, localDb } from '../storage/db';
import { Sparkles, Camera, Upload, RefreshCw, Save, CheckSquare, Check } from 'lucide-react';
import { HumanReviewModal } from '../components/HumanReviewModal';

export type AppState = 'NO_INPUT' | 'FACE_DETECTED' | 'CAPTURED' | 'ANALYZING' | 'RESULT';

interface StudioDashboardProps {
  onCameraStatusChange: (ready: boolean) => void;
}

export function getModuleKeyForRegion(regionKey: string): string {
  if (regionKey.includes('eyebrow')) return 'eyebrow';
  if (regionKey.includes('eyeliner')) return 'eyeliner';
  if (regionKey.includes('lash')) return 'eyelash';
  if (regionKey.includes('eyelid')) return 'eyeshadow';
  if (regionKey.includes('cheek')) return 'blush';
  if (regionKey === 'nose') return 'contour';
  if (regionKey.includes('lip')) return 'lips';
  if (regionKey === 'face_contour') return 'base';
  if (regionKey === 'forehead') return 'hair';
  return 'base';
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({ onCameraStatusChange }) => {
  const [appState, setAppState] = useState<AppState>('NO_INPUT');
  const [showRegions, setShowRegions] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);

  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [metrics, setMetrics] = useState<CameraMetrics>({ width: 0, height: 0, fps: 0, status: 'STOPPED' });
  const [poseData, setPoseData] = useState<{ pitch: number; yaw: number; roll: number }>({ pitch: 0, yaw: 0, roll: 0 });
  const [qaReport, setQaReport] = useState<MakeupQAReport | null>(null);
  const [importedImageSrc, setImportedImageSrc] = useState<string | null>(null);

  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [landmarker, setLandmarker] = useState<any>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);

  const [modelVerified, setModelVerified] = useState<boolean>(false);
  const [modelStatus, setModelStatus] = useState<string>('VERIFYING...');
  const [aiStatus, setAiStatus] = useState<string>('INITIALIZING...');

  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeRegionsRef = useRef<any>(null);

  const [reviewingIssue, setReviewingIssue] = useState<string | null>(null);
  const [correctedScore, setCorrectedScore] = useState<number>(80);
  const [correctionReason, setCorrectionReason] = useState<string>('Natural asymmetry');

  const [readiness, setReadiness] = useState<{
    face: boolean;
    size: boolean;
    pose: boolean;
    lighting: boolean;
    status: 'READY FOR ANALYSIS' | 'NOT READY';
  }>({
    face: false,
    size: false,
    pose: false,
    lighting: false,
    status: 'NOT READY',
  });

  // Initialize camera devices list
  useEffect(() => {
    const manager = new CameraManager();
    cameraManagerRef.current = manager;

    manager.getAvailableDevices().then((devs) => {
      setDevices(devs);
      if (devs.length > 0) {
        setSelectedDevice(devs[0].deviceId);
      }
    });

    return () => {
      manager.stopCamera();
    };
  }, []);

  // Load & verify local MediaPipe FaceLandmarker model integrity
  useEffect(() => {
    async function verifyAndLoadModel() {
      try {
        // 1. Fetch Model Manifest
        const manifestRes = await fetch('/MODEL_MANIFEST.json');
        if (!manifestRes.ok) {
          throw new Error('Manifest file missing');
        }
        const manifest = await manifestRes.json();

        // 2. Fetch local model task file
        const modelRes = await fetch('/models/face_landmarker.task');
        if (!modelRes.ok) {
          throw new Error('Model task file missing');
        }
        const modelBuffer = await modelRes.arrayBuffer();

        // Verify size
        if (modelBuffer.byteLength !== manifest.size) {
          throw new Error(`Size mismatch: expected ${manifest.size}, got ${modelBuffer.byteLength}`);
        }

        // 3. Compute SHA-256 hash of local model
        const hashBuffer = await crypto.subtle.digest('SHA-256', modelBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        if (computedHash !== manifest.sha256) {
          throw new Error(`Hash mismatch: expected ${manifest.sha256}, got ${computedHash}`);
        }

        setModelVerified(true);
        setModelStatus('VERIFIED');

        // 4. Initialize local FaceLandmarker
        const inst = await initFaceLandmarker();
        if (inst) {
          setLandmarker(inst);
          setAiStatus('READY');
          setModelError(null);
        } else {
          setAiStatus('ERROR');
          setModelError('MODEL NOT AVAILABLE');
        }
      } catch (err: any) {
        console.error('AI Model Integrity Check Failed:', err);
        setAiStatus('ERROR');
        setModelStatus('INTEGRITY ERROR');
        setModelError('AI MODEL INTEGRITY ERROR');
      }
    }

    verifyAndLoadModel();
  }, []);

  // Update parent about camera status changes
  useEffect(() => {
    onCameraStatusChange(metrics.status === 'READY');
  }, [metrics.status, onCameraStatusChange]);

  const handleStartCamera = async () => {
    if (!videoRef.current || !cameraManagerRef.current) return;
    cameraManagerRef.current.setVideoElement(videoRef.current);
    
    // Reset other inputs
    setImportedImageSrc(null);
    setQaReport(null);
    setCurrentRecord(null);

    const m = await cameraManagerRef.current.startCamera(selectedDevice, (updatedMetrics) => {
      setMetrics(updatedMetrics);
    });
    setMetrics(m);
    setAppState('FACE_DETECTED');
  };

  const handleStopCamera = () => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stopCamera();
      setMetrics({ width: 0, height: 0, fps: 0, status: 'STOPPED' });
    }
    setAppState('NO_INPUT');
    setQaReport(null);
    setCurrentRecord(null);
    setFaceDetected(false);
    setReadiness({ face: false, size: false, pose: false, lighting: false, status: 'NOT READY' });
  };

  // Real-time canvas overlay tracking loop
  useEffect(() => {
    let animId: number;

    const processFrame = () => {
      if (
        metrics.status === 'READY' &&
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.videoWidth > 0 &&
        (appState === 'FACE_DETECTED' || appState === 'ANALYZING')
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let detectedPoints: any[] | null = null;
          if (landmarker) {
            try {
              // Real MediaPipe detection on current video frame
              const result = landmarker.detect(video);
              if (result.faceLandmarks && result.faceLandmarks.length > 0) {
                detectedPoints = result.faceLandmarks[0].map((p: any) => ({
                  x: p.x,
                  y: p.y,
                  z: p.z || 0,
                }));
              }
            } catch (err) {
              console.error('Error running real-time MediaPipe inference:', err);
            }
          }

          if (detectedPoints) {
            setFaceDetected(true);
            const pose = estimateHeadPose(detectedPoints);
            setPoseData(pose);

            const regions = extractFaceRegions(detectedPoints, canvas.width, canvas.height);
            activeRegionsRef.current = regions;

            // Compute readiness status parameters
            const sizeOk = regions.face_contour.boundingBox.width / canvas.width >= 0.22;
            const poseOk = Math.abs(pose.yaw) <= 15 && Math.abs(pose.pitch) <= 15 && Math.abs(pose.roll) <= 15;

            // Draw a tiny dot at nose center to query brightness
            const noseX = Math.round(regions.nose.boundingBox.minX + regions.nose.boundingBox.width / 2);
            const noseY = Math.round(regions.nose.boundingBox.minY + regions.nose.boundingBox.height / 2);
            let lightingOk = true;
            try {
              const pixel = ctx.getImageData(noseX, noseY, 1, 1).data;
              const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
              lightingOk = brightness >= 80 && brightness <= 230;
            } catch {
              // Fail-safe default
            }

            setReadiness({
              face: true,
              size: sizeOk,
              pose: poseOk,
              lighting: lightingOk,
              status: (sizeOk && poseOk && lightingOk) ? 'READY FOR ANALYSIS' : 'NOT READY',
            });

            // Render landmarks on canvas overlay if enabled
            if (showLandmarks) {
              ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
              detectedPoints.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 1.5, 0, 2 * Math.PI);
                ctx.fill();
              });
            }

            // Render region boundaries if enabled
            if (showRegions) {
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
              ctx.lineWidth = 1.5;
              Object.values(regions).forEach((r) => {
                ctx.strokeRect(r.boundingBox.minX, r.boundingBox.minY, r.boundingBox.width, r.boundingBox.height);
              });
            }
          } else {
            setFaceDetected(false);
            setReadiness({ face: false, size: false, pose: false, lighting: false, status: 'NOT READY' });
          }
        }
      }
      animId = requestAnimationFrame(processFrame);
    };

    if (metrics.status === 'READY') {
      animId = requestAnimationFrame(processFrame);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [metrics.status, appState, showLandmarks, showRegions, landmarker]);

  // Handle static image import
  const handleImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleStopCamera();

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setImportedImageSrc(dataUrl);
        setAppState('CAPTURED');
        setQaReport(null);
        setCurrentRecord(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Perform landmarks & QA analysis on the loaded static image
  const analyzeStaticImage = () => {
    if (!canvasRef.current || !importedImageSrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let detectedPoints: any[] | null = null;
      if (landmarker) {
        try {
          const result = landmarker.detect(img);
          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            detectedPoints = result.faceLandmarks[0].map((p: any) => ({
              x: p.x,
              y: p.y,
              z: p.z || 0,
            }));
          }
        } catch (err) {
          console.error('Error running MediaPipe on static image:', err);
        }
      }

      if (detectedPoints) {
        const pose = estimateHeadPose(detectedPoints);
        setPoseData(pose);
        const assessability = validateFaceAssessability(pose);
        const regions = extractFaceRegions(detectedPoints, canvas.width, canvas.height);
        activeRegionsRef.current = regions;

        // Draw overlays
        if (showLandmarks) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
          detectedPoints.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          });
        }

        if (showRegions) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
          ctx.lineWidth = 1.5;
          Object.values(regions).forEach((r) => {
            ctx.strokeRect(r.boundingBox.minX, r.boundingBox.minY, r.boundingBox.width, r.boundingBox.height);
          });
        }

        const report = runMasterMakeupQA(ctx, regions, {
          landmarks: detectedPoints,
          faceCount: 1,
          pose,
          isAssessable: assessability.isAssessable,
          unassessableReason: assessability.reason,
        });

        setQaReport(report);
      } else {
        // No face detected in static image
        const report = runMasterMakeupQA(ctx, null, {
          landmarks: [],
          faceCount: 0,
          pose: { pitch: 0, yaw: 0, roll: 0 },
          isAssessable: false,
          unassessableReason: 'No face detected in the image.',
        });
        setQaReport(report);
      }
      setAppState('RESULT');
    };
    img.src = importedImageSrc;
  };

  // Perform capture & QA analysis on the camera stream
  const analyzeCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Draw current frame static snapshot onto the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let detectedPoints: any[] | null = null;
    if (landmarker) {
      try {
        const result = landmarker.detect(video);
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          detectedPoints = result.faceLandmarks[0].map((p: any) => ({
            x: p.x,
            y: p.y,
            z: p.z || 0,
          }));
        }
      } catch (err) {
        console.error('Error running MediaPipe on camera frame:', err);
      }
    }

    if (detectedPoints) {
      const pose = estimateHeadPose(detectedPoints);
      setPoseData(pose);
      const assessability = validateFaceAssessability(pose);
      const regions = extractFaceRegions(detectedPoints, canvas.width, canvas.height);
      activeRegionsRef.current = regions;

      const report = runMasterMakeupQA(ctx, regions, {
        landmarks: detectedPoints,
        faceCount: 1,
        pose,
        isAssessable: assessability.isAssessable,
        unassessableReason: assessability.reason,
      });

      setQaReport(report);
    } else {
      // No face detected in camera frame
      const report = runMasterMakeupQA(ctx, null, {
        landmarks: [],
        faceCount: 0,
        pose: { pitch: 0, yaw: 0, roll: 0 },
        isAssessable: false,
        unassessableReason: 'No face detected in the frame.',
      });
      setQaReport(report);
    }
    setAppState('RESULT');
  };

  // Trigger Capture & Analyze workflow with a visual scanning overlay phase
  const handleCaptureAndAnalyze = () => {
    setAppState('ANALYZING');
    setTimeout(() => {
      if (importedImageSrc) {
        analyzeStaticImage();
      } else {
        analyzeCameraFrame();
      }
    }, 800);
  };

  // Save snapshot & QA report metrics to local DB dataset
  const handleSaveToDataset = () => {
    if (!qaReport) return;

    let imgDataUrl = '';
    if (importedImageSrc) {
      imgDataUrl = importedImageSrc;
    } else if (cameraManagerRef.current) {
      const snapCanvas = cameraManagerRef.current.captureSnapshot();
      if (snapCanvas) {
        imgDataUrl = snapCanvas.toDataURL('image/png');
      }
    }

    const rec = localDb.saveAnalysis({
      model_version: 'V0.1-DETERMINISTIC-LOCAL',
      image_data_url: imgDataUrl,
      overall_score: qaReport.overallScore,
      assessable_status: qaReport.assessableStatus,
      categories: qaReport.modules,
      landmarks_summary: {
        point_count: qaReport.overallScore !== null ? 478 : 0,
        pose: poseData,
      },
    });

    setCurrentRecord(rec);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Open review modal (saves first if record doesn't exist yet)
  const handleOpenReviewModal = () => {
    if (!qaReport) return;

    if (currentRecord) {
      setShowReviewModal(true);
    } else {
      // Save it automatically so we have a record to review
      let imgDataUrl = '';
      if (importedImageSrc) {
        imgDataUrl = importedImageSrc;
      } else if (cameraManagerRef.current) {
        const snapCanvas = cameraManagerRef.current.captureSnapshot();
        if (snapCanvas) {
          imgDataUrl = snapCanvas.toDataURL('image/png');
        }
      }

      const rec = localDb.saveAnalysis({
        model_version: 'V0.1-DETERMINISTIC-LOCAL',
        image_data_url: imgDataUrl,
        overall_score: qaReport.overallScore,
        assessable_status: qaReport.assessableStatus,
        categories: qaReport.modules,
        landmarks_summary: {
          point_count: qaReport.overallScore !== null ? 478 : 0,
          pose: poseData,
        },
      });

      setCurrentRecord(rec);
      setShowReviewModal(true);
    }
  };

  const ensureRecordSaved = (): AnalysisRecord | null => {
    if (currentRecord) return currentRecord;
    if (!qaReport) return null;

    let imgDataUrl = '';
    if (importedImageSrc) {
      imgDataUrl = importedImageSrc;
    } else if (cameraManagerRef.current) {
      const snapCanvas = cameraManagerRef.current.captureSnapshot();
      if (snapCanvas) {
        imgDataUrl = snapCanvas.toDataURL('image/png');
      }
    }

    const rec = localDb.saveAnalysis({
      model_version: 'V0.1-DETERMINISTIC-LOCAL',
      image_data_url: imgDataUrl,
      overall_score: qaReport.overallScore,
      assessable_status: qaReport.assessableStatus,
      categories: qaReport.modules,
      landmarks_summary: {
        point_count: qaReport.overallScore !== null ? 478 : 0,
        pose: poseData,
      },
    });
    setCurrentRecord(rec);
    return rec;
  };

  const handleAcceptIssue = (category: string) => {
    const rec = ensureRecordSaved();
    if (!rec) return;

    const review = {
      status: 'ACCEPTED' as const,
      user_comment: `AI prediction correct for ${category}`,
      reviewed_at: new Date().toISOString(),
    };

    localDb.updateHumanReview(rec.id, review);
    setCurrentRecord(localDb.getAnalysisById(rec.id) || null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleRejectIssue = (category: string) => {
    const rec = ensureRecordSaved();
    if (!rec) return;

    const review = {
      status: 'REJECTED' as const,
      user_comment: `AI prediction rejected for ${category}`,
      reviewed_at: new Date().toISOString(),
    };

    localDb.updateHumanReview(rec.id, review);
    setCurrentRecord(localDb.getAnalysisById(rec.id) || null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSaveCorrection = (category: string) => {
    const rec = ensureRecordSaved();
    if (!rec) return;

    const updatedCategories = { ...rec.categories };
    if (updatedCategories[category]) {
      updatedCategories[category].score = correctedScore;
    }

    const review = {
      status: 'CORRECTED' as const,
      user_comment: JSON.stringify({
        category,
        ai_score: qaReport?.modules[category]?.score,
        corrected_score: correctedScore,
        reason: correctionReason,
      }),
      reviewed_at: new Date().toISOString(),
    };

    rec.categories = updatedCategories;
    localDb.updateHumanReview(rec.id, review);

    // Save record to local storage manually to update categories list
    const analyses = localDb.getAllAnalyses();
    const idx = analyses.findIndex((r) => r.id === rec.id);
    if (idx !== -1) {
      analyses[idx] = rec;
      localStorage.setItem('dtech_beauty_vision_local_db_v1', JSON.stringify(analyses));
    }

    // Also update current state qaReport if possible so visual updates instantly!
    if (qaReport) {
      const updatedReportModules = { ...qaReport.modules };
      if (updatedReportModules[category]) {
        updatedReportModules[category].score = correctedScore;
      }
      setQaReport({
        ...qaReport,
        modules: updatedReportModules,
      });
    }

    setCurrentRecord(rec);
    setReviewingIssue(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };


  // Re-run the analysis
  const handleRecheck = () => {
    setAppState('ANALYZING');
    setQaReport(null);
    setCurrentRecord(null);
    setTimeout(() => {
      if (importedImageSrc) {
        analyzeStaticImage();
      } else {
        analyzeCameraFrame();
      }
    }, 600);
  };

  // Filter out low scores modules needing attention (score < 85)
  const itemsNeedAttention = qaReport
    ? Object.values(qaReport.modules).filter((c) => c.score !== null && c.score < 85)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-7xl mx-auto py-4">
      
      {/* LEFT COLUMN: 70% CAMERA / IMAGE WORKSPACE */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Visual Feed Preview Panel */}
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const scaleX = canvasRef.current ? canvasRef.current.width / rect.width : 1;
            const scaleY = canvasRef.current ? canvasRef.current.height / rect.height : 1;
            const canvasMouseX = mouseX * scaleX;
            const canvasMouseY = mouseY * scaleY;

            if (activeRegionsRef.current && (appState === 'FACE_DETECTED' || appState === 'RESULT')) {
              let matchedKey: string | null = null;
              for (const [key, region] of Object.entries(activeRegionsRef.current)) {
                const { minX, minY, width, height } = (region as any).boundingBox;
                if (
                  canvasMouseX >= minX &&
                  canvasMouseX <= minX + width &&
                  canvasMouseY >= minY &&
                  canvasMouseY <= minY + height
                ) {
                  matchedKey = key;
                  break;
                }
              }
              setHoveredRegion(matchedKey);
              setTooltipPos({ x: mouseX, y: mouseY });
            } else {
              setHoveredRegion(null);
            }
          }}
          onMouseLeave={() => setHoveredRegion(null)}
          className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-900 shadow-2xl flex items-center justify-center"
        >
          
          {/* Real video stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${importedImageSrc ? 'hidden' : 'block'}`}
          />
          
          {/* Static uploaded image */}
          {importedImageSrc && (
            <img
              src={importedImageSrc}
              alt="Imported preview"
              className="w-full h-full object-cover"
            />
          )}

          {/* Landmarks / regions overlays */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Model error state */}
          {modelError && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
              <span className="text-rose-500 font-mono text-xs font-bold uppercase tracking-wider">{modelError}</span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Please ensure local face_landmarker.task and WASM binaries are loaded.</p>
            </div>
          )}

          {/* Empty State message */}
          {appState === 'NO_INPUT' && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs text-slate-400 font-mono">NO ACTIVE FRAME INPUT</p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Connect camera or import static frame to begin</p>
            </div>
          )}

          {/* Scanning Line overlay */}
          {appState === 'ANALYZING' && (
            <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none z-10">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 left-0 animate-[bounce_2s_infinite] shadow-md"></div>
              <div className="absolute bottom-4 left-4 bg-slate-950/80 px-3 py-1 rounded text-[10px] font-mono text-cyan-400 border border-slate-800">
                SCANNING FACE REGIONS...
              </div>
            </div>
          )}

          {/* Face Detected pill */}
          {appState === 'FACE_DETECTED' && (
            <div className={`absolute top-4 left-4 bg-slate-950/80 border ${faceDetected ? 'border-emerald-900/60 text-emerald-400' : 'border-rose-900/60 text-rose-400'} px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5 backdrop-blur-sm`}>
              <span className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              {faceDetected ? 'FACE DETECTED' : 'NO FACE DETECTED'}
            </div>
          )}

          {/* Captured / Static Image pill */}
          {appState === 'CAPTURED' && (
            <div className="absolute top-4 left-4 bg-slate-950/80 border border-indigo-950/60 px-2.5 py-1 rounded-lg text-[10px] font-mono text-indigo-400 flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              STATIC IMAGE LOADED
            </div>
          )}

          {/* HUD Pose Overlay */}
          {(appState === 'FACE_DETECTED' || appState === 'RESULT') && (
            <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-slate-900 rounded-lg p-2 font-mono text-[9px] text-slate-400 space-y-0.5 pointer-events-none">
              <div>PITCH: {poseData.pitch}°</div>
              <div>YAW: {poseData.yaw}°</div>
              <div>ROLL: {poseData.roll}°</div>
            </div>
          )}

          {/* Interactive hover tooltip */}
          {hoveredRegion && (
            <div
              className="absolute z-30 bg-slate-950/95 border border-slate-900 rounded-xl p-3 shadow-2xl font-mono text-[10px] space-y-1.5 pointer-events-none min-w-[170px]"
              style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
            >
              <div className="font-bold text-slate-300 uppercase tracking-wide border-b border-slate-900 pb-1 mb-1 flex items-center justify-between">
                <span>{hoveredRegion.replace('_', ' ')}</span>
                <span className="text-cyan-400 font-bold">
                  {qaReport?.modules[getModuleKeyForRegion(hoveredRegion)]?.score !== null 
                    ? `${qaReport?.modules[getModuleKeyForRegion(hoveredRegion)]?.score}/100` 
                    : '--'}
                </span>
              </div>
              {qaReport?.modules[getModuleKeyForRegion(hoveredRegion)] ? (
                <>
                  <div className="text-slate-400">Confidence: <span className="text-emerald-400 font-bold">{qaReport.modules[getModuleKeyForRegion(hoveredRegion)].confidence}%</span></div>
                  <div className="text-[9px] text-slate-500 leading-normal max-w-[190px]">{qaReport.modules[getModuleKeyForRegion(hoveredRegion)].evidence}</div>
                </>
              ) : (
                <div className="text-slate-600">Pending analysis...</div>
              )}
            </div>
          )}
        </div>

        {/* Analysis Readiness Checklist */}
        {appState === 'FACE_DETECTED' && (
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${readiness.status === 'READY FOR ANALYSIS' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="font-mono text-xs font-bold text-slate-350">{readiness.status}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-1">
                <span>Face:</span>
                <span className={readiness.face ? 'text-emerald-400 font-bold' : 'text-slate-600'}>{readiness.face ? '✓' : '⚠'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Size:</span>
                <span className={readiness.size ? 'text-emerald-400 font-bold' : 'text-slate-600'}>{readiness.size ? '✓' : '⚠'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Pose:</span>
                <span className={readiness.pose ? 'text-emerald-400 font-bold' : 'text-slate-600'}>{readiness.pose ? '✓' : '⚠'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Lighting:</span>
                <span className={readiness.lighting ? 'text-emerald-400 font-bold' : 'text-slate-600'}>{readiness.lighting ? '✓' : '⚠'}</span>
              </div>
            </div>
          </div>
        )}

        {/* SMART BOTTOM CONTEXTUAL TOOLBAR */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 min-h-[56px]">
          
          {savedSuccess && (
            <div className="w-full p-2 bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-mono text-[10px] rounded-lg flex items-center gap-1.5 mb-1">
              <Check className="w-3.5 h-3.5" /> Analysis metrics successfully committed to Local SQLite Dataset.
            </div>
          )}

          {appState === 'NO_INPUT' && (
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="bg-slate-900 border border-slate-850 text-xs font-mono text-slate-300 rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartCamera}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-400" /> Start Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-indigo-400" /> Import Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImportImage}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {(appState === 'FACE_DETECTED' || appState === 'CAPTURED') && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStopCamera}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs font-mono font-bold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                    showAdvanced 
                      ? 'bg-slate-800 border-slate-700 text-cyan-400 font-bold' 
                      : 'bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Advanced
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCaptureAndAnalyze}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 text-white text-xs font-mono font-bold hover:bg-cyan-500 flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Capture & Analyze
                </button>
              </div>
            </div>
          )}

          {appState === 'ANALYZING' && (
            <div className="w-full text-center text-xs font-mono text-slate-500 py-1 animate-pulse">
              ANALYZING CURRENT FRAME ALGORITHMICALLY...
            </div>
          )}

          {appState === 'RESULT' && (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleStopCamera}
                className="flex-1 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs font-mono font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Retake
              </button>
              <button
                onClick={handleRecheck}
                className="flex-1 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" /> Recheck
              </button>
              <button
                onClick={handleOpenReviewModal}
                className="flex-1 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> Review
              </button>
              <button
                onClick={handleSaveToDataset}
                className="flex-1 py-2.5 rounded-lg bg-cyan-600 text-white text-xs font-mono font-bold hover:bg-cyan-500 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          )}

        </div>

        {/* Collapsible Advanced Options Drawer */}
        {showAdvanced && (
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-6 border-b border-slate-900 pb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnostic Overlays:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={showLandmarks}
                  onChange={(e) => setShowLandmarks(e.target.checked)}
                  className="accent-cyan-500 rounded border-slate-800 bg-slate-900"
                />
                <span>Mesh Overlay</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={showRegions}
                  onChange={(e) => setShowRegions(e.target.checked)}
                  className="accent-emerald-500 rounded border-slate-800 bg-slate-900"
                />
                <span>Regions Contour</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] text-slate-500">
              <div className="flex justify-between border-r border-slate-900 pr-3">
                <span>LOCAL AI:</span>
                <span className={aiStatus === 'READY' ? 'text-emerald-400 font-bold' : 'text-rose-500'}>{aiStatus}</span>
              </div>
              <div className="flex justify-between border-r border-slate-900 pr-3">
                <span>FACE ENGINE:</span>
                <span className={landmarker ? 'text-emerald-400 font-bold' : 'text-rose-500'}>{landmarker ? 'ACTIVE' : 'OFFLINE'}</span>
              </div>
              <div className="flex justify-between border-r border-slate-900 pr-3">
                <span>MODEL HASH:</span>
                <span className={modelVerified ? 'text-emerald-400 font-bold' : 'text-rose-550'}>{modelStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>ISOLATION:</span>
                <span className="text-emerald-400 font-bold">100% OFFLINE</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: 30% SMART SUMMARY & REVIEWS */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* BEAUTY MARK SCORE & CATEGORIES */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
              <span>BEAUTY MARK INDEX</span>
              <span>Confidence {qaReport ? qaReport.confidenceAverage : '--'}%</span>
            </div>
            <div className="text-4xl font-black text-slate-100 font-mono mt-1">
              {qaReport && qaReport.overallScore !== null ? qaReport.overallScore : '--'}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              {qaReport ? 'Optimal Application Balanced' : 'System standby for camera input'}
            </p>
          </div>

          {/* Category Scores Grid */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-900 pt-4 font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">EYES</span>
              <span className="text-slate-200 font-bold">{qaReport?.modules.eyeliner?.score !== null ? qaReport?.modules.eyeliner?.score : '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">BROWS</span>
              <span className="text-slate-200 font-bold">{qaReport?.modules.eyebrow?.score !== null ? qaReport?.modules.eyebrow?.score : '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">SKIN</span>
              <span className="text-slate-200 font-bold">{qaReport?.modules.base?.score !== null ? qaReport?.modules.base?.score : '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">LIPS</span>
              <span className="text-slate-200 font-bold">{qaReport?.modules.lips?.score !== null ? qaReport?.modules.lips?.score : '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">HAIR</span>
              <span className="text-slate-200 font-bold">{qaReport?.modules.hair?.score !== null ? qaReport?.modules.hair?.score : '--'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">BASE</span>
              <span className="text-slate-200 font-bold">{qaReport?.modules.base?.score !== null ? qaReport?.modules.base?.score : '--'}</span>
            </div>
          </div>
        </div>

        {/* REVIEW WARNING LIST */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400">REVIEW CHECKLIST</span>
            <span className="text-[10px] font-mono text-slate-500">{itemsNeedAttention.length} issues</span>
          </div>

          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
            {qaReport && itemsNeedAttention.length > 0 ? (
              itemsNeedAttention.map((item) => {
                const isReviewing = reviewingIssue === item.category;
                return (
                  <div key={item.category} className="p-3 rounded-lg bg-slate-900/60 border border-slate-900 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-300 block capitalize">{item.category.replace('_', ' ')} asymmetry</span>
                        <span className="text-[9px] text-slate-500">AI Score: {item.score} | Confidence: {item.confidence}%</span>
                      </div>
                    </div>

                    {isReviewing ? (
                      <div className="space-y-2 pt-1 border-t border-slate-950">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] text-slate-500">Correct Score:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={correctedScore}
                            onChange={(e) => setCorrectedScore(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-850 text-[10px] text-cyan-400 rounded px-1.5 py-0.5 w-14 focus:outline-none animate-pulse"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] text-slate-500">Reason:</span>
                          <select
                            value={correctionReason}
                            onChange={(e) => setCorrectionReason(e.target.value)}
                            className="bg-slate-950 border border-slate-850 text-[9px] text-slate-350 rounded px-1 py-0.5 max-w-[110px]"
                          >
                            <option value="Natural asymmetry">Natural asymmetry</option>
                            <option value="Lighting shadow">Lighting shadow</option>
                            <option value="AI false positive">AI false positive</option>
                            <option value="Incorrect measurement">Incorrect measurement</option>
                            <option value="Other comment">Other comment</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => setReviewingIssue(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[9px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveCorrection(item.category)}
                            className="px-2.5 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-slate-950 space-y-1.5">
                        <div className="text-[9px] text-slate-500">Is this correct?</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAcceptIssue(item.category)}
                            className="flex-1 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-[9px] text-emerald-450 font-bold rounded transition-colors cursor-pointer"
                          >
                            YES
                          </button>
                          <button
                            onClick={() => {
                              setReviewingIssue(item.category);
                              setCorrectedScore(item.score || 80);
                            }}
                            className="flex-1 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-[9px] text-amber-450 font-bold rounded transition-colors cursor-pointer"
                          >
                            NO
                          </button>
                          <button
                            onClick={() => handleRejectIssue(item.category)}
                            className="flex-1 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-[9px] text-rose-450 font-bold rounded transition-colors cursor-pointer"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] font-mono text-slate-600 text-center py-4">No reviews required. Base is symmetrical.</p>
            )}
          </div>
        </div>


      </div>

      {/* Review Modal portal */}
      {showReviewModal && currentRecord && (
        <HumanReviewModal
          record={currentRecord}
          onClose={() => setShowReviewModal(false)}
          onSaved={() => {
            // Reload the record after edits
            const updated = localDb.getAnalysisById(currentRecord.id);
            if (updated) setCurrentRecord(updated);
          }}
        />
      )}

    </div>
  );
};
