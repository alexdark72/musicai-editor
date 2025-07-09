import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Tipi per l'audio e le tracce
export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  waveformData?: number[];
}

export interface SeparationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  originalFile: File;
  tracks: AudioTrack[];
  createdAt: Date;
  estimatedTime?: number;
  error?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  loop: boolean;
}

export interface EditorState {
  zoom: number;
  selectedTracks: string[];
  viewStart: number;
  viewEnd: number;
  snapToGrid: boolean;
  gridSize: number;
}

export interface MashupSettings {
  track1?: AudioTrack;
  track2?: AudioTrack;
  crossfadeTime: number;
  beatMatching: boolean;
  keyMatching: boolean;
  autoAlign: boolean;
}

// Store principale dell'applicazione
interface AppStore {
  // Stati globali
  isLoading: boolean;
  currentSession: string | null;
  
  // Job di separazione
  separationJobs: SeparationJob[];
  currentJob: SeparationJob | null;
  
  // Playback
  playback: PlaybackState;
  
  // Editor
  editor: EditorState;
  
  // Mashup
  mashup: MashupSettings;
  
  // Azioni globali
  setLoading: (loading: boolean) => void;
  setCurrentSession: (sessionId: string | null) => void;
  
  // Azioni per i job
  addSeparationJob: (job: SeparationJob) => void;
  updateSeparationJob: (jobId: string, updates: Partial<SeparationJob>) => void;
  removeSeparationJob: (jobId: string) => void;
  setCurrentJob: (job: SeparationJob | null) => void;
  
  // Azioni per il playback
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  
  // Azioni per l'editor
  setZoom: (zoom: number) => void;
  setSelectedTracks: (trackIds: string[]) => void;
  addSelectedTrack: (trackId: string) => void;
  removeSelectedTrack: (trackId: string) => void;
  setViewRange: (start: number, end: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  
  // Azioni per le tracce
  updateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  
  // Azioni per il mashup
  setMashupTrack1: (track: AudioTrack) => void;
  setMashupTrack2: (track: AudioTrack) => void;
  setMashupSettings: (settings: Partial<MashupSettings>) => void;
  
  // Reset
  resetEditor: () => void;
  resetMashup: () => void;
}

// Stati iniziali
const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playbackRate: 1.0,
  loop: false,
};

const initialEditorState: EditorState = {
  zoom: 1.0,
  selectedTracks: [],
  viewStart: 0,
  viewEnd: 100,
  snapToGrid: true,
  gridSize: 0.25, // 1/4 di secondo
};

const initialMashupSettings: MashupSettings = {
  crossfadeTime: 4.0,
  beatMatching: true,
  keyMatching: false,
  autoAlign: true,
};

// Store Zustand
export const useAppStore = create<AppStore>()(devtools(
  (set, get) => ({
    // Stati iniziali
    isLoading: false,
    currentSession: null,
    separationJobs: [],
    currentJob: null,
    playback: initialPlaybackState,
    editor: initialEditorState,
    mashup: initialMashupSettings,
    
    // Azioni globali
    setLoading: (loading) => set({ isLoading: loading }),
    setCurrentSession: (sessionId) => set({ currentSession: sessionId }),
    
    // Azioni per i job
    addSeparationJob: (job) => set((state) => ({
      separationJobs: [...state.separationJobs, job],
    })),
    
    updateSeparationJob: (jobId, updates) => set((state) => ({
      separationJobs: state.separationJobs.map(job => 
        job.id === jobId ? { ...job, ...updates } : job
      ),
      currentJob: state.currentJob?.id === jobId 
        ? { ...state.currentJob, ...updates } 
        : state.currentJob,
    })),
    
    removeSeparationJob: (jobId) => set((state) => ({
      separationJobs: state.separationJobs.filter(job => job.id !== jobId),
      currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
    })),
    
    setCurrentJob: (job) => set({ currentJob: job }),
    
    // Azioni per il playback
    setPlaying: (playing) => set((state) => ({
      playback: { ...state.playback, isPlaying: playing },
    })),
    
    setCurrentTime: (time) => set((state) => ({
      playback: { ...state.playback, currentTime: time },
    })),
    
    setDuration: (duration) => set((state) => ({
      playback: { ...state.playback, duration },
    })),
    
    setVolume: (volume) => set((state) => ({
      playback: { ...state.playback, volume },
    })),
    
    setPlaybackRate: (rate) => set((state) => ({
      playback: { ...state.playback, playbackRate: rate },
    })),
    
    toggleLoop: () => set((state) => ({
      playback: { ...state.playback, loop: !state.playback.loop },
    })),
    
    // Azioni per l'editor
    setZoom: (zoom) => set((state) => ({
      editor: { ...state.editor, zoom },
    })),
    
    setSelectedTracks: (trackIds) => set((state) => ({
      editor: { ...state.editor, selectedTracks: trackIds },
    })),
    
    addSelectedTrack: (trackId) => set((state) => ({
      editor: {
        ...state.editor,
        selectedTracks: [...state.editor.selectedTracks, trackId],
      },
    })),
    
    removeSelectedTrack: (trackId) => set((state) => ({
      editor: {
        ...state.editor,
        selectedTracks: state.editor.selectedTracks.filter(id => id !== trackId),
      },
    })),
    
    setViewRange: (start, end) => set((state) => ({
      editor: { ...state.editor, viewStart: start, viewEnd: end },
    })),
    
    toggleSnapToGrid: () => set((state) => ({
      editor: { ...state.editor, snapToGrid: !state.editor.snapToGrid },
    })),
    
    setGridSize: (size) => set((state) => ({
      editor: { ...state.editor, gridSize: size },
    })),
    
    // Azioni per le tracce
    updateTrack: (trackId, updates) => set((state) => {
      const updateJobTracks = (job: SeparationJob) => ({
        ...job,
        tracks: job.tracks.map(track => 
          track.id === trackId ? { ...track, ...updates } : track
        ),
      });
      
      return {
        separationJobs: state.separationJobs.map(updateJobTracks),
        currentJob: state.currentJob ? updateJobTracks(state.currentJob) : null,
      };
    }),
    
    toggleTrackMute: (trackId) => {
      const { updateTrack } = get();
      const currentJob = get().currentJob;
      if (currentJob) {
        const track = currentJob.tracks.find(t => t.id === trackId);
        if (track) {
          updateTrack(trackId, { muted: !track.muted });
        }
      }
    },
    
    toggleTrackSolo: (trackId) => {
      const { updateTrack } = get();
      const currentJob = get().currentJob;
      if (currentJob) {
        const track = currentJob.tracks.find(t => t.id === trackId);
        if (track) {
          updateTrack(trackId, { solo: !track.solo });
        }
      }
    },
    
    setTrackVolume: (trackId, volume) => {
      const { updateTrack } = get();
      updateTrack(trackId, { volume });
    },
    
    setTrackPan: (trackId, pan) => {
      const { updateTrack } = get();
      updateTrack(trackId, { pan });
    },
    
    // Azioni per il mashup
    setMashupTrack1: (track) => set((state) => ({
      mashup: { ...state.mashup, track1: track },
    })),
    
    setMashupTrack2: (track) => set((state) => ({
      mashup: { ...state.mashup, track2: track },
    })),
    
    setMashupSettings: (settings) => set((state) => ({
      mashup: { ...state.mashup, ...settings },
    })),
    
    // Reset
    resetEditor: () => set({
      editor: initialEditorState,
      playback: initialPlaybackState,
    }),
    
    resetMashup: () => set({
      mashup: initialMashupSettings,
    }),
  }),
  {
    name: 'musicai-editor-store',
  }
));