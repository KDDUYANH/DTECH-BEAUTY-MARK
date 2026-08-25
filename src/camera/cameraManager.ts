export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export interface CameraMetrics {
  width: number;
  height: number;
  fps: number;
  status: 'READY' | 'NO_CAMERA' | 'PERMISSION_DENIED' | 'STOPPED';
}

export class CameraManager {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private frameCount = 0;
  private lastFpsCheck = performance.now();
  private currentFps = 0;
  private animFrameId: number | null = null;

  private onMetricsUpdate?: (metrics: CameraMetrics) => void;

  constructor(videoElement?: HTMLVideoElement) {
    if (videoElement) {
      this.videoElement = videoElement;
    }
  }

  public setVideoElement(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }

  public async getAvailableDevices(): Promise<CameraDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
    } catch (err) {
      console.warn('Error listing video input devices:', err);
      return [];
    }
  }

  public async startCamera(deviceId?: string, onMetrics?: (m: CameraMetrics) => void): Promise<CameraMetrics> {
    this.onMetricsUpdate = onMetrics;
    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const metrics: CameraMetrics = { width: 0, height: 0, fps: 0, status: 'NO_CAMERA' };
      if (this.onMetricsUpdate) this.onMetricsUpdate(metrics);
      return metrics;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }

      this.startFpsLoop();

      const track = this.stream.getVideoTracks()[0];
      const settings = track.getSettings();

      const metrics: CameraMetrics = {
        width: settings.width || 1280,
        height: settings.height || 720,
        fps: this.currentFps,
        status: 'READY',
      };

      if (this.onMetricsUpdate) this.onMetricsUpdate(metrics);
      return metrics;
    } catch (err: any) {
      console.error('Failed to access camera input stream:', err);
      const isPermission = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const status = isPermission ? 'PERMISSION_DENIED' : 'NO_CAMERA';
      const metrics: CameraMetrics = { width: 0, height: 0, fps: 0, status };
      if (this.onMetricsUpdate) this.onMetricsUpdate(metrics);
      return metrics;
    }
  }

  public stopCamera() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate({ width: 0, height: 0, fps: 0, status: 'STOPPED' });
    }
  }

  private startFpsLoop() {
    const loop = () => {
      this.frameCount++;
      const now = performance.now();
      const delta = now - this.lastFpsCheck;

      if (delta >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFpsCheck = now;

        if (this.stream && this.videoElement) {
          const track = this.stream.getVideoTracks()[0];
          const settings = track ? track.getSettings() : {};
          if (this.onMetricsUpdate) {
            this.onMetricsUpdate({
              width: settings.width || this.videoElement.videoWidth || 0,
              height: settings.height || this.videoElement.videoHeight || 0,
              fps: this.currentFps,
              status: 'READY',
            });
          }
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public captureSnapshot(): HTMLCanvasElement | null {
    if (!this.videoElement || this.videoElement.videoWidth === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
}
