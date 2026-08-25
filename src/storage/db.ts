/**
 * Local Database Storage Layer (SQLite / IndexedDB engine)
 * Operating 100% locally without external server dependencies.
 */

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  model_version: string;
  image_data_url: string; // Captured local frame/image
  overall_score: number | null;
  assessable_status: 'ASSESSABLE' | 'NOT_ASSESSABLE' | 'LOW_CONFIDENCE';
  categories: Record<string, any>;
  landmarks_summary: {
    point_count: number;
    pose: { pitch: number; yaw: number; roll: number };
  };
  human_review?: {
    status: 'ACCEPTED' | 'REJECTED' | 'UNCERTAIN' | 'CORRECTED';
    user_comment: string;
    corrected_severity?: string;
    corrected_category?: string;
    reviewed_at: string;
  };
}

const STORAGE_KEY = 'dtech_beauty_vision_local_db_v1';

export class LocalDatabase {
  private static instance: LocalDatabase;
  private records: AnalysisRecord[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load local DB records:', err);
      this.records = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (err) {
      console.error('Failed to save to local DB:', err);
    }
  }

  public saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'timestamp'>): AnalysisRecord {
    const fullRecord: AnalysisRecord = {
      ...record,
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.records.unshift(fullRecord);
    this.saveToStorage();
    return fullRecord;
  }

  public updateHumanReview(
    recordId: string,
    review: NonNullable<AnalysisRecord['human_review']>
  ): boolean {
    const idx = this.records.findIndex((r) => r.id === recordId);
    if (idx === -1) return false;

    this.records[idx].human_review = review;
    this.saveToStorage();
    return true;
  }

  public getAllAnalyses(): AnalysisRecord[] {
    return [...this.records];
  }

  public getAnalysisById(id: string): AnalysisRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  public clearAllData() {
    this.records = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  public exportDatasetJSON(): string {
    return JSON.stringify(
      {
        dataset_name: 'D-Tech Proprietary Local Dataset',
        model_version: 'V0.1-LOCAL-DETERMINISTIC',
        exported_at: new Date().toISOString(),
        sample_count: this.records.length,
        samples: this.records,
      },
      null,
      2
    );
  }
}

export const localDb = LocalDatabase.getInstance();
