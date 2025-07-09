import axios, { AxiosProgressEvent } from 'axios';
import { SeparationJob, AudioTrack } from '../store/appStore';

// Configurazione base di Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minuti per operazioni lunghe
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per gestire errori globali
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 413) {
      throw new Error('File troppo grande. Dimensione massima: 100MB');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Troppi tentativi. Riprova tra qualche minuto.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Errore del server. Riprova più tardi.');
    }
    
    throw error;
  }
);

// Tipi per le risposte API
export interface UploadResponse {
  session_id: string;
  message: string;
  file_info: {
    filename: string;
    size: number;
    duration: number;
    sample_rate: number;
    channels: number;
  };
}

export interface SeparationResponse {
  job_id: string;
  status: string;
  message: string;
  estimated_time?: number;
}

export interface StatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
  stems?: {
    [key: string]: {
      filename: string;
      url: string;
      duration: number;
    };
  };
  analysis?: {
    tempo: number;
    key: string;
    energy: number;
    danceability: number;
  };
}

export interface MashupRequest {
  session_id: string;
  track1_stem: string;
  track2_stem: string;
  settings: {
    crossfade_time: number;
    beat_matching: boolean;
    key_matching: boolean;
    auto_align: boolean;
  };
}

export interface MashupResponse {
  job_id: string;
  status: string;
  message: string;
  mashup_url?: string;
}

// Servizio API
export class AudioAPI {
  /**
   * Upload di un file audio
   */
  static async uploadAudio(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    
    return response.data;
  }
  
  /**
   * Avvia la separazione audio in 16 tracce
   */
  static async startSeparation(sessionId: string): Promise<SeparationResponse> {
    const response = await api.post('/separate', {
      session_id: sessionId,
    });
    
    return response.data;
  }
  
  /**
   * Controlla lo stato di un job di separazione
   */
  static async getJobStatus(jobId: string): Promise<StatusResponse> {
    const response = await api.get(`/status/${jobId}`);
    return response.data;
  }
  
  /**
   * Download di una singola traccia separata
   */
  static async downloadStem(
    sessionId: string,
    stemName: string
  ): Promise<Blob> {
    const response = await api.get(
      `/download/${sessionId}/${stemName}`,
      {
        responseType: 'blob',
      }
    );
    
    return response.data;
  }
  
  /**
   * Download di tutte le tracce separate come ZIP
   */
  static async downloadAllStems(sessionId: string): Promise<Blob> {
    const response = await api.get(
      `/download/${sessionId}/all`,
      {
        responseType: 'blob',
      }
    );
    
    return response.data;
  }
  
  /**
   * Crea un mashup tra due tracce
   */
  static async createMashup(request: MashupRequest): Promise<MashupResponse> {
    const response = await api.post('/mashup', request);
    return response.data;
  }
  
  /**
   * Ottieni informazioni sulla sessione
   */
  static async getSessionInfo(sessionId: string) {
    const response = await api.get(`/session/${sessionId}`);
    return response.data;
  }
  
  /**
   * Elimina una sessione e tutti i file associati
   */
  static async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/session/${sessionId}`);
  }
  
  /**
   * Ottieni statistiche del server
   */
  static async getServerStats() {
    const response = await api.get('/stats');
    return response.data;
  }
  
  /**
   * Health check del server
   */
  static async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  }
}

// Hook personalizzati per React Query
export const useAudioAPI = () => {
  return {
    uploadAudio: AudioAPI.uploadAudio,
    startSeparation: AudioAPI.startSeparation,
    getJobStatus: AudioAPI.getJobStatus,
    downloadStem: AudioAPI.downloadStem,
    downloadAllStems: AudioAPI.downloadAllStems,
    createMashup: AudioAPI.createMashup,
    getSessionInfo: AudioAPI.getSessionInfo,
    deleteSession: AudioAPI.deleteSession,
    getServerStats: AudioAPI.getServerStats,
    healthCheck: AudioAPI.healthCheck,
  };
};

// Utility per gestire i download
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Utility per convertire le risposte API in oggetti del store
export const convertStatusToJob = (
  status: StatusResponse,
  originalFile: File,
  createdAt: Date
): Partial<SeparationJob> => {
  const tracks: AudioTrack[] = [];
  
  if (status.stems) {
    Object.entries(status.stems).forEach(([stemName, stemInfo], index) => {
      tracks.push({
        id: `${status.job_id}_${stemName}`,
        name: stemName,
        url: stemInfo.url,
        duration: stemInfo.duration,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        color: getTrackColor(index),
      });
    });
  }
  
  return {
    id: status.job_id,
    status: status.status,
    progress: status.progress,
    tracks,
    error: status.error,
    estimatedTime: status.status === 'processing' ? undefined : 0,
  };
};

// Colori per le tracce
const trackColors = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#22c55e', // Green
  '#eab308', // Yellow
  '#3b82f6', // Blue
  '#f43f5e', // Rose
  '#64748b', // Slate
];

const getTrackColor = (index: number): string => {
  return trackColors[index % trackColors.length];
};

export default api;